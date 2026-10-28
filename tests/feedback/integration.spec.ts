import { test, expect, type Page, type Route } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { campaign, validDraft, receipt } from "./contract-fixtures";
import { localFixture } from "./local-fixture";
const API = "https://api.homemind.vn/v1/public/feedback-popup";
const title = "30 Ngày Đặc Quyền Premium";
const dialog = (page: Page) => page.getByRole("dialog", { name: title, exact: true });
const opener = (page: Page) => page.getByRole("button", { name: /30 Ngày Đặc Quyền Premium|Xem lượt gửi|Xem thông tin chương trình/ });
const send = (page: Page) => dialog(page).getByRole("button", { name: "Gửi góp ý & đăng ký trải nghiệm", exact: true });
type Wire = { method: string; body: unknown; key?: string };
type Harness = { config: unknown; posts: Wire[]; gets: number; handler?: (route: Route) => Promise<void>; errors: string[]; live: boolean; intentionalNetworkError?: boolean };
const harness = new WeakMap<Page, Harness>();
test.beforeEach(async ({ page }, info) => {
  const state: Harness = { config: structuredClone(campaign), posts: [], gets: 0, errors: [], live: false }; harness.set(page, state);
  page.on("pageerror", error => state.errors.push(error.message));
  page.on("console", msg => { if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource:")) state.errors.push(msg.text()); });
  // Every API request is intercepted BEFORE navigation. No production POST can
  // leave this suite. Live mode explicitly forwards only these two routes to
  // the ownership-checked local Nest/PostgreSQL fixture.
  await page.route("https://api.homemind.vn/**", async route => {
    const request=route.request(); const target=request.url();
    if (target !== API && target !== `${API}/submissions`) { state.errors.push("Unexpected API route"); await route.abort(); return; }
    if (request.method()==="POST") state.posts.push({method:request.method(),body:request.postDataJSON(),key:request.headers()["idempotency-key"]});else state.gets++;
    if(state.live){const fixture=localFixture();const response=await route.fetch({url:target.replace("https://api.homemind.vn/v1",fixture.baseUrl)});await route.fulfill({response});return;}
    if(request.method()==="GET") await route.fulfill({json:state.config});
    else if(state.handler) await state.handler(route);
    else await route.fulfill({status:202,json:receipt});
  });
  if (info.project.name === "chromium" && process.env.FEEDBACK_BROWSER_COVERAGE === "1") await page.coverage.startJSCoverage({ resetOnNavigation:false });
});
test.afterEach(async ({page},info)=>{
  if(info.project.name==="chromium"&&process.env.FEEDBACK_BROWSER_COVERAGE==="1") writeFileSync(info.outputPath("browser-coverage.json"),JSON.stringify((await page.coverage.stopJSCoverage()).filter(e=>e.source?.includes("HomeMind Premium")||e.source?.includes("Submission rejected")||e.source?.includes("Outcome unavailable"))));
  if(harness.get(page)!.live)localFixture().enabled(false);
  const expected = harness.get(page)!.intentionalNetworkError && info.project.name === "firefox" ? ['[JavaScript Error: "Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https://api.homemind.vn/v1/public/feedback-popup/submissions. (Reason: CORS request did not succeed). Status code: (null)."]'] : [];
  expect(harness.get(page)!.errors,"Only the exact browser diagnostic for an explicitly aborted fixture request is expected; no runtime/hydration errors").toEqual(expected);
});
async function open(page:Page){
  await page.goto("/",{waitUntil:"networkidle"});
  // Verify initial invitation separately; this helper exercises manual reopening
  // and explicit opener focus restoration for the existing contract cases.
  await expect(dialog(page)).toBeVisible();
  await page.getByRole("button",{name:"Đóng cửa sổ góp ý",exact:true}).click();
  await opener(page).click(); await expect(dialog(page)).toBeVisible();
}
async function fill(page:Page){await page.getByRole("textbox",{name:"Họ và tên",exact:true}).fill(validDraft.fullName);await page.getByRole("textbox",{name:"Số điện thoại",exact:true}).fill(validDraft.phoneNumber);await page.getByRole("textbox",{name:"Email",exact:true}).fill(validDraft.email);await page.getByRole("textbox",{name:"Góp ý của bạn",exact:true}).fill(validDraft.review);}

for (const outcome of ["submitted", "rejected", "uncertain"]) test(`mobile outcome ${outcome} is visible after submitting from the bottom of the form`, async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 650 });
  harness.get(page)!.handler = route => outcome === "submitted" ? route.fulfill({ status: 202, json: receipt }) : outcome === "rejected" ? route.fulfill({ status: 400, json: { error: { code: "VALIDATION_ERROR", message: "Fixture only", details: [] } } }) : route.fulfill({ status: 502, body: "Fixture lost result" });
  await open(page); await fill(page); await send(page).click();
  const notice = outcome === "submitted" ? dialog(page).getByRole("heading", { name: "Đã gửi thông tin", exact: true }) : dialog(page).getByRole("alert");
  await expect(notice).toBeInViewport();
  await expect(page.getByRole("button", { name: "Đóng cửa sổ góp ý", exact: true })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Gửi lượt góp ý mới", exact: true })).toBeInViewport();
  expect(harness.get(page)!.posts).toHaveLength(1);
  await page.screenshot({ path: info.outputPath(`outcome-${outcome}-390.png`), animations: "disabled" });
});

for (const availability of ["disabled", "malformed"]) test(`outcome new-operation CTA stays disabled after ${availability} campaign precheck until manual recovery`, async ({ page }) => {
  const state = harness.get(page)!; state.handler = route => route.fulfill({ status: 503, json: { error: { code: "FEEDBACK_POPUP_UNAVAILABLE" } } });
  await open(page); await fill(page); await send(page).click();
  await expect(dialog(page).getByRole("alert")).toContainText("Chưa gửi được thông tin");
  state.config = availability === "disabled" ? { ...campaign, enabled: false } : { enabled: true };
  await page.getByRole("button", { name: "Thử lại cùng lượt gửi", exact: true }).click();
  const next = page.getByRole("button", { name: "Gửi lượt góp ý mới", exact: true });
  await expect(page.getByRole("button", { name: "Kiểm tra lại chương trình", exact: true })).toBeVisible();
  await expect(next).toBeDisabled(); await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue(validDraft.email);
  await page.getByRole("button", { name: "Đóng cửa sổ góp ý", exact: true }).focus(); await page.keyboard.press("Shift+Tab");
  await expect(dialog(page).getByRole("button", { name: "Kiểm tra lại chương trình", exact: true })).toBeFocused();
  await page.keyboard.press("Tab"); await expect(page.getByRole("button", { name: "Đóng cửa sổ góp ý", exact: true })).toBeFocused();
  expect(state.posts).toHaveLength(1);
  state.config = campaign; state.handler = route => route.fulfill({ status: 202, json: receipt });
  let release!: () => Promise<void>;
  const refresh = async (route: Route) => { state.gets++; release = () => route.fulfill({ json: campaign }); await new Promise<void>(() => {}); };
  await page.route(API, refresh); await page.getByRole("button", { name: "Kiểm tra lại chương trình", exact: true }).click();
  await expect.poll(() => typeof release).toBe("function"); await expect(next).toBeDisabled();
  await release(); await page.unroute(API, refresh); await expect(next).toBeEnabled();
  await next.click(); expect(state.posts).toHaveLength(1); await send(page).click();
  await expect(dialog(page).getByRole("heading", { name: "Đã gửi thông tin", exact: true })).toBeVisible();
  expect(state.posts).toHaveLength(2); expect(state.posts[1].key).not.toBe(state.posts[0].key);
});
test("real form labels, local errors, summary keyboard navigation, focus and preserved draft",async({page})=>{
  await open(page);await send(page).click();const input=page.getByRole("textbox",{name:"Họ và tên",exact:true});await expect(input).toBeFocused();await expect(input).toHaveAttribute("aria-invalid","true");const described=await input.getAttribute("aria-describedby");await expect(page.locator(`[id="${described}"]`)).toHaveText("Vui lòng nhập họ và tên.");expect(harness.get(page)!.posts).toHaveLength(0);
  await fill(page);await page.keyboard.press("Escape");await expect(opener(page)).toBeFocused();await opener(page).click();await expect(input).toHaveValue(validDraft.fullName);
  await page.keyboard.press("Tab");await expect(page.getByRole("button",{name:"Đóng cửa sổ góp ý"})).toBeFocused();await page.keyboard.press("Tab");
  await test.info().attach("summary-focus-diagnostic", { body: JSON.stringify(await page.evaluate(() => ({ activeTag: document.activeElement?.tagName, activeId: document.activeElement?.id, summaryTabIndex: document.querySelector("summary")?.tabIndex, summaryActive: document.activeElement === document.querySelector("summary") }))), contentType: "application/json" });
  await expect(page.locator("summary")).toBeFocused();await page.keyboard.press("Tab");
  await expect(dialog(page).getByRole("link",{name:/Điều khoản chương trình/})).toBeFocused();await page.keyboard.press("Tab");
  await expect(dialog(page).getByRole("link",{name:/Chính sách bảo mật/})).toBeFocused();await page.keyboard.press("Tab");await expect(input).toBeFocused();
});
test("accepted neutral result, intentional new operation, exact raw body and privacy",async({page})=>{
  await open(page);await fill(page);await send(page).click();await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin"})).toBeVisible();expect(harness.get(page)!.posts).toHaveLength(1);expect(harness.get(page)!.posts[0].body).toEqual(validDraft);expect(harness.get(page)!.posts[0].key).toMatch(/^[a-f0-9-]{36}$/);
  await expect(dialog(page)).not.toContainText("đã kích hoạt thành công");await page.getByRole("button",{name:"Gửi lượt góp ý mới",exact:true}).click();await expect(page.getByRole("textbox",{name:"Email",exact:true})).toBeEnabled();expect(harness.get(page)!.posts).toHaveLength(1);await send(page).click();await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin"})).toBeVisible();expect(harness.get(page)!.posts).toHaveLength(2);expect(harness.get(page)!.posts[1].key).not.toBe(harness.get(page)!.posts[0].key);
  expect(await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}))).toEqual({local:{},session:{}});expect(page.url()).not.toContain(validDraft.email);await expect(page.locator('input[name="password"],input[type="checkbox"]')).toHaveCount(0);
});
for(const config of [false,"unavailable","malformed","loading"]){test(`initial config ${config} never invites or auto opens`,async({page})=>{
  const state=harness.get(page)!;if(config===false)state.config={...campaign,enabled:false};else if(config==="malformed")state.config={enabled:true};else await page.route(API,route=>config==="loading"?new Promise<void>(()=>{}):route.fulfill({status:503,json:{error:{code:"FEEDBACK_POPUP_UNAVAILABLE"}}}));
  await page.goto("/",{waitUntil:"domcontentloaded"});await expect(dialog(page)).toBeHidden();await expect(opener(page)).toHaveCount(0);expect(state.posts).toHaveLength(0);
});}
test("fresh config disabled/unavailable before POST and explicit recovery",async({page})=>{
  await open(page);await fill(page);const state=harness.get(page)!;state.config={...campaign,enabled:false};await send(page).click();await expect(dialog(page).getByRole("alert")).toContainText("không nhận thông tin");expect(state.posts).toHaveLength(0);await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue(validDraft.email);
  state.config={enabled:true};await page.getByRole("button",{name:"Kiểm tra lại chương trình"}).click();await expect(dialog(page).getByRole("alert")).toContainText("Chưa thể xác nhận");state.config=campaign;await page.getByRole("button",{name:"Kiểm tra lại chương trình"}).click();await expect(send(page)).toBeEnabled();await page.keyboard.press("Escape");await expect(opener(page)).toBeFocused();await expect(dialog(page)).toBeHidden();
});
test("pending double click/Enter close/reopen and late completion use one operation",async({page})=>{
  let release!:()=>void;harness.get(page)!.handler=async route=>{await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({status:202,json:receipt});};
  await open(page);await fill(page);await send(page).dblclick();await expect(page.getByRole("button",{name:"Đang gửi…",exact:true})).toBeDisabled();await page.keyboard.press("Enter");await page.keyboard.press("Escape");await expect(dialog(page)).toBeHidden();await opener(page).click();await expect(page.getByRole("textbox",{name:"Email",exact:true})).toBeDisabled();expect(harness.get(page)!.posts).toHaveLength(1);release();await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin"})).toBeVisible();
});
for(const [status,code] of [[400,"VALIDATION_ERROR"],[403,"ORIGIN_NOT_ALLOWED"],[409,"FEEDBACK_POPUP_DISABLED"],[409,"IDEMPOTENCY_CONFLICT"],[413,"PAYLOAD_TOO_LARGE"],[415,"UNSUPPORTED_MEDIA_TYPE"],[429,"RATE_LIMITED"],[503,"FEEDBACK_POPUP_BUSY"],[503,"FEEDBACK_POPUP_UNAVAILABLE"],[500,"INTERNAL_ERROR"]] as const)test(`HTTP presentation ${status} ${code} avoids raw/XSS and keeps data`,async({page},info)=>{
  harness.get(page)!.handler=route=>route.fulfill({status,headers:{"Retry-After":"1","Access-Control-Expose-Headers":"Retry-After"},json:{error:{code,message:"<script>window.leak='server secret'</script>",details:[{field:"review",code:"INVALID_FORMAT",message:"sensitive stack trace"}]}}});
  await open(page);await fill(page);await send(page).click();await expect(dialog(page).getByRole("alert").first()).toBeVisible();await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue(validDraft.email);await expect(dialog(page)).not.toContainText("sensitive stack trace");expect(await page.evaluate(()=>Reflect.get(window,"leak"))).toBeUndefined();
  if(status===400){const review=page.getByRole("textbox",{name:"Góp ý của bạn",exact:true});await expect(review).toHaveAttribute("aria-invalid","true");await expect(page.locator(`[id="${await review.getAttribute("aria-describedby")}"]`)).toHaveText("Thông tin chưa đúng định dạng.");}
  if(status===429||code==="FEEDBACK_POPUP_BUSY")await expect(page.getByRole("button",{name:"Thử lại cùng lượt gửi"})).toBeEnabled();
  if(status===500)await expect(dialog(page)).toContainText("Hệ thống có thể đã nhận thông tin");
  if(info.project.name==="chromium")await page.screenshot({path:info.outputPath(`error-${status}-${code}.png`),animations:"disabled"});
});
for(const failure of ["network","non-json","malformed","timeout"]){test(`uncertain ${failure} retry same key/body, new operation new key`,async({page})=>{
  const state=harness.get(page)!;state.intentionalNetworkError=failure==="network";state.handler=async route=>{if(failure==="network")await route.abort("failed");else if(failure==="non-json")await route.fulfill({status:202,body:"broken"});else if(failure==="malformed")await route.fulfill({status:202,json:{...receipt,status:"ACTIVE"}});else await new Promise<void>(()=>{});};
  await open(page);await fill(page);await send(page).click();await expect(dialog(page).getByRole("alert")).toContainText("Chưa xác nhận được kết quả gửi",{timeout:25_000});expect(state.posts).toHaveLength(1);state.handler=route=>route.fulfill({status:202,json:receipt});await page.getByRole("button",{name:"Thử lại cùng lượt gửi"}).click();await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin"})).toBeVisible();expect(state.posts[1]).toEqual(state.posts[0]);
});}
for(const width of [360,390,768,1280,1440])test(`form responsive ${width}px and low viewport/error/long content`,async({page},info)=>{
  await page.setViewportSize({width,height:width<480?800:900});await open(page);await fill(page);await page.screenshot({path:info.outputPath(`form-${width}.png`),animations:"disabled"});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const close=page.getByRole("button",{name:"Đóng cửa sổ góp ý"});await expect(close).toBeInViewport();await expect(send(page)).toBeInViewport();
  await page.setViewportSize({width,height:320});await page.locator("summary").click();await page.getByRole("textbox",{name:"Góp ý của bạn",exact:true}).fill("Tiếng Việt e\u0301 <script>bad</script> 👪".repeat(120));await expect(close).toBeInViewport();await expect(send(page)).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath(`form-low-${width}.png`),animations:"disabled"});await page.keyboard.press("Escape");await expect(opener(page)).toBeFocused();
});
test("actual form composition/paste/autofill events retain Unicode and do not submit IME Enter",async({page})=>{
  await open(page);await fill(page);const name=page.getByRole("textbox",{name:"Họ và tên",exact:true});await name.dispatchEvent("compositionstart");await name.press("Enter");expect(harness.get(page)!.posts).toHaveLength(0);await name.dispatchEvent("compositionend");const value="Nguyễn e\u0301 <b>😀</b>";await name.evaluate((node,v)=>{const el=node as HTMLInputElement;const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!;setter.call(el,v);el.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"insertFromPaste",data:v}));},value);await expect(name).toHaveValue(value);await send(page).click();await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin"})).toBeVisible();expect((harness.get(page)!.posts[0].body as typeof validDraft).fullName).toBe(value);
});
test("real browser HTTP through isolated released Nest/PostgreSQL",async({page})=>{
  const state=harness.get(page)!;state.live=true;localFixture().enabled(true);await open(page);await fill(page);await send(page).click();await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin"})).toBeVisible();await page.getByRole("button",{name:"Gửi lượt góp ý mới",exact:true}).click();await send(page).click();await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin"})).toBeVisible();expect(state.posts).toHaveLength(2);expect(state.posts[0].key).not.toBe(state.posts[1].key);
});
test("two local browser tabs submit independently; real backend allocates only one reward to owned fixture account", async ({ page }) => {
  const fixture = localFixture(); fixture.enabled(true); harness.get(page)!.live = true;
  const email = `fe-tabs-${randomUUID()}@example.test`, phone = `091${Math.floor(1000000 + Math.random()*8999999)}`;
  const registration = await fetch(`${fixture.baseUrl}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, phone, displayName: "Local FE two tabs", password: randomUUID(), workspaceType: "household", acceptedTerms: true, acceptedPrivacy: true }) });
  expect(registration.status).toBe(201); const account = (await registration.json()).user; expect(account.id).toMatch(/^[a-f0-9-]{36}$/);
  const second = await page.context().newPage(); const keys: string[] = [];
  // Install the second tab's deny-by-default API boundary BEFORE navigation.
  await second.route("https://api.homemind.vn/**", async route => {
    const target = route.request().url();
    if (![API, `${API}/submissions`].includes(target)) { await route.abort(); throw new Error("Unverified second-tab API"); }
    if (route.request().method() === "POST") keys.push(route.request().headers()["idempotency-key"]);
    const response = await route.fetch({ url: target.replace("https://api.homemind.vn/v1", fixture.baseUrl) }); await route.fulfill({ response });
  });
  for (const tab of [page, second]) { await open(tab); await fill(tab); await tab.getByRole("textbox",{name:"Email",exact:true}).fill(email); await tab.getByRole("textbox",{name:"Số điện thoại",exact:true}).fill(phone); }
  await Promise.all([send(page).click(), send(second).click()]);
  for (const tab of [page, second]) await expect(dialog(tab).getByRole("heading", { name: "Đã gửi thông tin" })).toBeVisible();
  expect(harness.get(page)!.posts).toHaveLength(1); expect(keys).toHaveLength(1); expect(keys[0]).not.toBe(harness.get(page)!.posts[0].key);
  expect(JSON.parse(fixture.sql(`SELECT json_build_object('submissions',(SELECT count(*) FROM feedback_popup_submissions WHERE email='${email}'),'issued',(SELECT count(*) FROM feedback_popup_rewards WHERE user_id='${account.id}' AND allotment_consumed));`))).toEqual({ submissions: 2, issued: 1 });
  await second.close();
});
test("pending navigation aborts owned request; direct reload stays closed and fixture route absent",async({page})=>{
  harness.get(page)!.handler=()=>new Promise<void>(()=>{});await open(page);await fill(page);await send(page).click();await expect(page.getByRole("button",{name:"Đang gửi…",exact:true})).toBeDisabled();await page.keyboard.press("Escape");await page.goto("/privacy-policy");await expect(page.getByRole("heading",{level:1})).toBeVisible();await page.goto("/");await expect(dialog(page)).toBeVisible();expect(harness.get(page)!.posts).toHaveLength(1);expect((await page.request.get("/feedback-fixture")).status()).toBe(process.env.FEEDBACK_PREVIEW==="1"?200:404);
});
test("unknown prototype-named field error codes cannot crash or inject UI", async ({ page }) => {
  harness.get(page)!.handler = route => route.fulfill({ status: 400, json: { error: { code: "VALIDATION_ERROR", message: "untrusted", details: [{ field: "review", code: "__proto__", message: "<script>window.leak=1</script>" }] } } });
  await open(page); await fill(page); await send(page).click(); await expect(dialog(page).getByRole("alert")).toContainText("Chưa gửi được thông tin.");
  await expect(page.getByRole("textbox",{name:"Góp ý của bạn",exact:true})).toHaveAttribute("aria-invalid", "false"); expect(await page.evaluate(() => Reflect.get(window, "leak"))).toBeUndefined();
});

test("adapter initialization failure stays closed without a request or fake success", async ({ page }) => {
  await page.addInitScript(() => {
    const NativeURL = window.URL;
    window.URL = class extends NativeURL {
      constructor(input: string | URL, base?: string | URL) {
        if (input === "https://api.homemind.vn" && base === undefined) throw new Error("Explicit test fault at adapter initialization");
        super(input, base);
      }
    };
  });
  await page.goto("/", { waitUntil: "networkidle" }); await expect(opener(page)).toHaveCount(0); await expect(dialog(page)).toBeHidden();
  expect(harness.get(page)!.gets).toBe(0); expect(harness.get(page)!.posts).toHaveLength(0);
});

test("rate-limit retry with failed precheck remains neutral and allows an intentional new operation", async ({ page }) => {
  const state = harness.get(page)!;
  state.handler = route => route.fulfill({ status: 429, headers: { "Retry-After": "1", "Access-Control-Expose-Headers": "Retry-After" }, json: { error: { code: "RATE_LIMITED", message: "fixture", details: null } } });
  await open(page); await fill(page); await send(page).click();
  const retry = page.getByRole("button", { name: "Thử lại cùng lượt gửi", exact: true }); await expect(retry).toBeEnabled();
  state.config = { enabled: true }; await retry.click();
  await expect(dialog(page).getByRole("alert")).toContainText("Chưa gửi được thông tin."); expect(state.posts).toHaveLength(1);
  state.config = campaign; await page.getByRole("button", { name: "Kiểm tra lại chương trình", exact: true }).click();
  await page.getByRole("button", { name: "Gửi lượt góp ý mới", exact: true }).click(); expect(state.posts).toHaveLength(1);
  state.handler = route => route.fulfill({ status: 202, json: receipt }); await send(page).click();
  await expect(dialog(page).getByRole("heading", { name: "Đã gửi thông tin", exact: true })).toBeVisible(); expect(state.posts).toHaveLength(2); expect(state.posts[1].key).not.toBe(state.posts[0].key);
});
