import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createFeedbackAdapter, validCampaign } from "../../src/features/feedback/http-adapter";
import { FeedbackSubmissionError } from "../../src/features/feedback/adapter";
import { validateFeedback, feedbackFields } from "../../src/features/feedback/validation";
import { validDraft } from "./contract-fixtures";
import { localFixture } from "./local-fixture";
const fixture = localFixture();
const url = `${fixture.baseUrl}/public/feedback-popup`;
const headers = { "Content-Type": "application/json", Origin: "https://homemind.vn" };
const signal = () => new AbortController().signal;
const adapter = () => createFeedbackAdapter(new URL(fixture.baseUrl).origin, (target, init) => fetch(target, { ...init, headers: { ...init?.headers, Origin: "https://homemind.vn" } }));
test.beforeAll(() => fixture.enabled(true));
test.afterAll(() => fixture.enabled(false));
const submit = (body: unknown, key: string = randomUUID()) => fetch(`${url}/submissions`, { method: "POST", headers: { ...headers, "Idempotency-Key": key }, body: JSON.stringify(body) });
test("real config/OPTIONS/no cookies and anonymous adapter submission", async () => {
  const config = await fetch(url, { headers }); expect(config.status).toBe(200); expect(validCampaign(await config.json())).toBe(true);
  expect(config.headers.get("Cache-Control")).toBe("no-store"); expect(config.headers.get("Access-Control-Allow-Origin")).toBe(headers.Origin); expect(config.headers.get("set-cookie")).toBeNull();
  const options=await fetch(`${url}/submissions`,{method:"OPTIONS",headers:{Origin:headers.Origin,"Access-Control-Request-Method":"POST","Access-Control-Request-Headers":"content-type,idempotency-key"}});
  expect(options.status).toBe(204);expect(options.headers.get("access-control-allow-credentials")).toBeNull();
  const client=adapter();expect(await client.loadCampaign(signal())).toBe("enabled");expect(await client.submit({draft:validDraft,key:randomUUID()},signal())).toBe("submitted");
});
test("idempotent replay, conflict, explicit new submission and disabled replay", async () => {
  const key=randomUUID();const first=await submit(validDraft,key);expect(first.status).toBe(202);const receipt=await first.json();expect(Object.keys(receipt).sort()).toEqual(["acceptedAt","message","status","submissionId"]);
  const replay=await submit({...validDraft,email:validDraft.email.toLowerCase(),phoneNumber:"+84912345678"},key);expect(replay.status).toBe(202);expect(await replay.json()).toEqual(receipt);
  const conflict=await submit({...validDraft,review:"Different operation"},key);expect(conflict.status).toBe(409);expect((await conflict.json()).error.code).toBe("IDEMPOTENCY_CONFLICT");
  const next=await submit(validDraft);expect((await next.json()).submissionId).not.toBe(receipt.submissionId);
  fixture.enabled(false);expect(await adapter().loadCampaign(signal())).toBe("disabled");const denied=await submit(validDraft);expect(denied.status).toBe(409);expect((await denied.json()).error.code).toBe("FEEDBACK_POPUP_DISABLED");
  expect(await (await submit(validDraft,key)).json()).toEqual(receipt);fixture.enabled(true);
});
for (const field of feedbackFields) test(`real required/type/control validation ${field}`,async()=>{
  for(const value of [undefined,null,"","   ",1,"\u0000","\ud800"]){const body={...validDraft,[field]:value};const result=await submit(body);expect(result.status).toBe(400);const error=(await result.json()).error;expect(error.code).toBe("VALIDATION_ERROR");expect(error.details.some((e:{field:string})=>e.field===field)).toBe(true);expect(validateFeedback(body)[field]).toBeTruthy();}
});
for(const [field,max] of [["fullName",120],["review",5000]] as const) test(`real Unicode NFC boundaries ${field}`,async()=>{
  for(const count of [0,1,max-1,max,max+1]){const body={...validDraft,[field]:"👪".repeat(count)};const result=await submit(body);expect(result.status).toBe(count===0||count>max?400:202);expect(!!validateFeedback(body)[field]).toBe(count===0||count>max);}
  expect((await submit({...validDraft,[field]:"e\u0301".repeat(max)})).status).toBe(202);
});
test("real raw caps/contact validation exactly agrees with FE",async()=>{
  for(const [field,cap] of [["fullName",1000],["review",20000],["email",1000],["phoneNumber",200]] as const) for(const count of [cap-1,cap,cap+1]){
    const inner=validDraft[field];const body={...validDraft,[field]:inner+" ".repeat(count-inner.length)};expect((await submit(body)).status).toBe(count>cap?400:202);
  }
  for(const email of ["a+b.c@example.invalid","é@example.invalid","e\u0301@example.invalid","a..b@example.invalid","a@localhost",`${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`,`${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(62)}`]){const body={...validDraft,email};expect((await submit(body)).status).toBe(validateFeedback(body).email?400:202);}
  for(const phoneNumber of ["+84 912 345 678","84912345678","+1 202 555 0123","x","+84"+" ".repeat(27)+"912345678","+84"+" ".repeat(28)+"912345678","+84"+" ".repeat(29)+"912345678"]){const body={...validDraft,phoneNumber};expect((await submit(body)).status).toBe(validateFeedback(body).phoneNumber?400:202);}
});
test("real protocol/origin/unknown fields and error mapping",async()=>{
  const extra=await submit({...validDraft,userId:randomUUID(),plan:"personal"});expect(extra.status).toBe(400);expect((await extra.json()).error.details.some((e:{code:string})=>e.code==="UNKNOWN_FIELD")).toBe(true);
  expect((await fetch(`${url}/submissions`,{method:"POST",headers,body:"{"})).status).toBe(400);
  expect((await fetch(`${url}/submissions`,{method:"POST",headers:{...headers,"Content-Type":"text/plain"},body:"bad"})).status).toBe(415);
  const denied=await fetch(url,{headers:{Origin:"https://evil.invalid"}});expect(denied.status).toBe(403);
  expect((await submit(validDraft,"invalid")).status).toBe(400);
  expect((await submit({...validDraft,review:"x".repeat(40000)})).status).toBe(413);
  fixture.enabled(false);await expect(adapter().submit({draft:validDraft,key:randomUUID()},signal())).rejects.toBeInstanceOf(FeedbackSubmissionError);fixture.enabled(true);
});
test("real delayed signup, repeated feedback, durable single award, neutral public receipt",async()=>{
  const email=`fe-${randomUUID()}@example.invalid`;const body={...validDraft,email,phoneNumber:`091${Math.floor(1000000+Math.random()*8999999)}`};
  const first=await submit(body);expect(first.status).toBe(202);const firstReceipt=await first.json();
  // New local identity. No production account endpoints or database operations.
  const registration=await fetch(`${fixture.baseUrl}/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,phone:body.phoneNumber,displayName:"Fixture FE",password:randomUUID(),workspaceType:"household",acceptedTerms:true,acceptedPrivacy:true})});
  expect(registration.status).toBe(201);const account=(await registration.json()).user;
  const next=await submit(body);expect(next.status).toBe(202);const nextReceipt=await next.json();expect(nextReceipt.submissionId).not.toBe(firstReceipt.submissionId);expect(Object.keys(nextReceipt).sort()).toEqual(Object.keys(firstReceipt).sort());
  // Fixed generated UUID guards SQL interpolation; never read an account supplied by a visitor.
  expect(account.id).toMatch(/^[a-f0-9-]{36}$/);const totals=fixture.sql(`SELECT json_build_object('submissions',(SELECT count(*) FROM feedback_popup_submissions WHERE email='${email}'),'issued',(SELECT count(*) FROM feedback_popup_rewards WHERE user_id='${account.id}' AND allotment_consumed));`);
  expect(JSON.parse(totals)).toEqual({submissions:2,issued:1});
});
