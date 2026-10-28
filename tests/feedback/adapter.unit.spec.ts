import { test, expect } from "@playwright/test";
import { createFeedbackAdapter, validCampaign } from "../../src/features/feedback/http-adapter";
import { FeedbackSubmissionError } from "../../src/features/feedback/adapter";
import { campaign, receipt, validDraft } from "./contract-fixtures";
const signal = () => new AbortController().signal;
const operation = { draft: validDraft, key: receipt.submissionId };
const response = (body: unknown, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });
test("exact endpoint/method/headers/cache/credentials and unchanged 4-field DTO", async () => {
  const calls: Array<[string, RequestInit | undefined]> = [];
  const adapter = createFeedbackAdapter("https://api.example.invalid", async (url, options) => { calls.push([String(url), options]); return response(calls.length === 1 ? campaign : receipt, calls.length === 1 ? 200 : 202); });
  expect(await adapter.loadCampaign(signal())).toBe("enabled");
  const extraDraft = { ...validDraft, secret: "must not serialize" };
  expect(await adapter.submit({ ...operation, draft: extraDraft }, signal())).toBe("submitted");
  expect(calls.map(([url]) => url)).toEqual(["https://api.example.invalid/v1/public/feedback-popup", "https://api.example.invalid/v1/public/feedback-popup/submissions"]);
  expect(calls[0][1]).toMatchObject({ cache: "no-store", credentials: "omit", redirect: "error" });
  expect(calls[1][1]).toMatchObject({ method: "POST", cache: "no-store", credentials: "omit", redirect: "error", headers: { "Content-Type": "application/json", "Idempotency-Key": operation.key } });
  expect(JSON.parse(calls[1][1]!.body as string)).toEqual(validDraft);
});
for (const value of [null, [], {}, true, { ...campaign, enabled: "true" }, { ...campaign, revision: 0 }, { ...campaign, revision: 1.5 }, { ...campaign, updatedAt: "2026-02-30T00:00:00.000Z" }, { ...campaign, offer: {} }, { ...campaign, fields: {} }, { ...campaign, idempotency: {} }, { ...campaign, fields: { ...campaign.fields, email: { required: true, minLength: 3, maxLength: 255 } } }]) test(`malformed config fails closed ${JSON.stringify(value)}`, async () => {
  expect(validCampaign(value)).toBe(false);
  await expect(createFeedbackAdapter("http://127.0.0.1:3419", async () => response(value)).loadCampaign(signal())).rejects.toThrow();
});
test("disabled and additive optional config metadata accepted; read errors denied", async () => {
  expect(await createFeedbackAdapter("https://api.example.invalid", async () => response({ ...campaign, enabled: false, optional: "safe" })).loadCampaign(signal())).toBe("disabled");
  await expect(createFeedbackAdapter("https://api.example.invalid", async () => response(campaign, 503)).loadCampaign(signal())).rejects.toThrow();
});
for (const origin of ["http://remote.invalid", "https://u:p@api.invalid", "https://api.invalid/path", "https://api.invalid?q=x", "https://api.invalid#x", "not-url"]) test(`invalid origin ${origin}`, () => expect(() => createFeedbackAdapter(origin)).toThrow());
for (const body of [{ ...receipt, extra: null }, receipt]) test(`valid 202 with optional metadata ${Object.keys(body).length}`, async () => expect(await createFeedbackAdapter("https://api.invalid", async () => response(body, 202)).submit(operation, signal())).toBe("submitted"));
for (const [body, status] of [[{},202],[null,202],[{...receipt,status:"ACTIVE"},202],[{...receipt,submissionId:"x"},202],[{...receipt,acceptedAt:"x"},202],[{...receipt,message:null},202],[receipt,200],[{error:{code:"UNRECOGNIZED",message:"<script>secret</script>"}},409],[{error:{code:"INTERNAL_ERROR"}},500]] as const) test(`uncertain response ${status} ${JSON.stringify(body)}`, async () => {
  try { await createFeedbackAdapter("https://api.invalid", async () => response(body,status)).submit(operation,signal()); throw new Error("False success"); }
  catch (error) { expect(error).not.toBeInstanceOf(FeedbackSubmissionError); expect((error as Error).message).toBe("Submission outcome unavailable"); }
});
for (const [status,code] of [[400,"VALIDATION_ERROR"],[400,"INVALID_JSON"],[400,"INVALID_IDEMPOTENCY_KEY"],[403,"FORBIDDEN"],[403,"ORIGIN_NOT_ALLOWED"],[409,"FEEDBACK_POPUP_DISABLED"],[409,"IDEMPOTENCY_CONFLICT"],[413,"PAYLOAD_TOO_LARGE"],[415,"UNSUPPORTED_MEDIA_TYPE"],[429,"RATE_LIMITED"],[503,"FEEDBACK_POPUP_BUSY"],[503,"FEEDBACK_POPUP_UNAVAILABLE"]] as const) test(`documented rejection ${status} ${code}`, async () => {
  const adapter = createFeedbackAdapter("https://api.invalid", async () => response({ error: { code, message: "unsafe secret", details: [{field:"review",code:"REQUIRED",message:"<img onerror=alert(1)>"}, {field:"userId",code:"REQUIRED"},null,{field:"email",code:"NEW"}] } },status));
  try { await adapter.submit(operation,signal()); throw new Error("Expected rejection"); } catch (error) { expect(error).toBeInstanceOf(FeedbackSubmissionError); const e=error as FeedbackSubmissionError; expect(e.code).toBe(code); expect(e.fields).toEqual({ review: "Vui lòng nhập góp ý của bạn." }); expect(JSON.stringify(e.fields)).not.toContain("secret"); if(status===429 || code==="FEEDBACK_POPUP_BUSY") expect(e.retryAt).toBeGreaterThan(Date.now()); }
});
test("field codes, Retry-After and invalid request avoid HTTP; non-JSON/network abort remain uncertain", async () => {
  let calls=0;
  const adapter=createFeedbackAdapter("https://api.invalid",async()=>{calls++;return response({error:{code:"RATE_LIMITED",details:null}},429,{"Retry-After":"3"});});
  await expect(adapter.submit({...operation,draft:{...validDraft,review:""}},signal())).rejects.toBeInstanceOf(FeedbackSubmissionError);
  await expect(adapter.submit({...operation,key:"bad"},signal())).rejects.toBeInstanceOf(FeedbackSubmissionError);expect(calls).toBe(0);
  try{await adapter.submit(operation,signal());}catch(e){expect((e as FeedbackSubmissionError).retryAt-Date.now()).toBeGreaterThan(2500);}
  for(const request of [async()=>new Response("broken",{status:202}),async()=>{throw new TypeError("offline");}]) await expect(createFeedbackAdapter("https://api.invalid",request).submit(operation,signal())).rejects.toThrow();
  const errors=["INVALID_TYPE","TOO_LONG","INVALID_FORMAT","INVALID_CHARACTERS"].map((code,i)=>({field:["fullName","phoneNumber","email","review"][i],code}));
  try{await createFeedbackAdapter("https://api.invalid",async()=>response({error:{code:"VALIDATION_ERROR",details:errors}},400)).submit(operation,signal());}catch(e){expect(Object.keys((e as FeedbackSubmissionError).fields)).toHaveLength(4);}
});

test("valid individual raw caps can exceed documented total body cap; no POST",async()=>{
  const email=validDraft.email;
  let calls=0;const oversized={...validDraft,fullName:"👪".repeat(120)+" ".repeat(760),review:"👪".repeat(5000)+"\n".repeat(10000),email:email+" ".repeat(1000-email.length),phoneNumber:validDraft.phoneNumber+" ".repeat(200-validDraft.phoneNumber.length)};
  expect(new TextEncoder().encode(JSON.stringify(oversized)).length).toBeGreaterThan(32768);
  try{await createFeedbackAdapter("https://api.invalid",async()=>{calls++;return response(receipt,202);}).submit({...operation,draft:oversized},signal());throw new Error("Expected rejection");}catch(e){expect(e).toBeInstanceOf(FeedbackSubmissionError);expect((e as FeedbackSubmissionError).code).toBe("PAYLOAD_TOO_LARGE");}expect(calls).toBe(0);
});
test("prototype property names are unknown field codes, never rendered errors", async () => {
  for (const code of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
    const adapter = createFeedbackAdapter("https://api.invalid", async () => response({ error: { code: "VALIDATION_ERROR", details: [{ field: "review", code, message: "untrusted" }] } }, 400));
    try { await adapter.submit(operation, signal()); throw new Error("Expected rejection"); }
    catch (failure) { expect(failure).toBeInstanceOf(FeedbackSubmissionError); expect((failure as FeedbackSubmissionError).fields).toEqual({}); }
  }
});
