import { test, expect, type Page, type Route } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { campaign, validDraft, receipt } from "./contract-fixtures";
import { REOPEN_DELAY_MS } from "../../src/features/feedback/invitation";
import { rewardPolicy } from "../../src/features/feedback/policy";

const API="https://api.homemind.vn/v1/public/feedback-popup";
const NAME="30 Ngày Đặc Quyền Premium";
const dialog=(page:Page)=>page.getByRole("dialog",{name:NAME,exact:true});
const close=(page:Page)=>page.getByRole("button",{name:"Đóng cửa sổ góp ý",exact:true});
const opener=(page:Page)=>page.locator("main section").first().getByRole("button",{name:/30 Ngày Đặc Quyền Premium|Xem lượt gửi góp ý|Xem thông tin chương trình/});
const send=(page:Page)=>dialog(page).getByRole("button",{name:"Gửi góp ý & đăng ký trải nghiệm",exact:true});
type State={config:unknown;gets:number;posts:{body:unknown;key:string|undefined}[];getHandler?: (route:Route)=>Promise<void>;postHandler?: (route:Route)=>Promise<void>;errors:string[]};
const states=new WeakMap<Page,State>();
test.beforeEach(async({page},info)=>{
  const state:State={config:structuredClone(campaign),gets:0,posts:[],errors:[]};states.set(page,state);
  page.on("pageerror",error=>state.errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error"&&!message.text().startsWith("Failed to load resource:"))state.errors.push(message.text());});
  // Fixtures only: all API traffic intercepted before navigation, no live POST.
  await page.route("https://api.homemind.vn/**",async route=>{
    const req=route.request();
    if(req.url()===API&&req.method()==="GET"){state.gets++;if(state.getHandler)await state.getHandler(route);else await route.fulfill({json:state.config});}
    else if(req.url()===API+"/submissions"&&req.method()==="POST"){state.posts.push({body:req.postDataJSON(),key:req.headers()["idempotency-key"]});if(state.postHandler)await state.postHandler(route);else await route.fulfill({status:202,json:receipt});}
    else if(req.method()==="GET"&&req.url().endsWith("/v1/admin/auth/me"))await route.fulfill({status:401,json:{error:{code:"ADMIN_UNAUTHORIZED",message:"Fixture guest",fields:[]}}});
    else await route.abort();
  });
  if(info.project.name==="chromium"&&process.env.FEEDBACK_BROWSER_COVERAGE==="1")await page.coverage.startJSCoverage({resetOnNavigation:false});
});
test.afterEach(async({page},info)=>{
  if(info.project.name==="chromium"&&process.env.FEEDBACK_BROWSER_COVERAGE==="1")writeFileSync(info.outputPath("browser-coverage.json"),JSON.stringify(await page.coverage.stopJSCoverage()));
  expect(states.get(page)!.errors,"No new console/hydration/runtime errors").toEqual([]);
});
async function home(page:Page){await page.goto("/",{waitUntil:"networkidle"});await expect(dialog(page)).toBeVisible();}
async function frozenHome(page:Page){await page.clock.install();await home(page);await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));}
async function fill(page:Page){for(const [label,value] of [["Họ và tên",validDraft.fullName],["Số điện thoại",validDraft.phoneNumber],["Email",validDraft.email],["Góp ý của bạn",validDraft.review]])await page.getByRole("textbox",{name:label,exact:true}).fill(value);}

for (const width of [390,1440]) test(`REGRESSION-02 homepage fragment survives initial invitation and reopen at ${width}px`,async({page})=>{
  await page.clock.install();
  await page.setViewportSize({width,height:900});
  await page.goto("/privacy-policy",{waitUntil:"networkidle"});
  if(width<1280) await page.getByRole("button",{name:"Mở menu điều hướng"}).click();
  await page.getByRole("navigation",{name:width<1280?"Điều hướng di động":"Điều hướng chính",exact:true}).getByRole("link",{name:"Tính năng",exact:true}).click();
  await expect(page).toHaveURL(/\/#features$/);await expect(dialog(page)).toBeVisible();
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
  await close(page).click();await expect(page.locator("#features h2")).toBeInViewport();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  await page.clock.fastForward(120_000);await expect(dialog(page)).toBeVisible();
  await close(page).click();expect(await page.evaluate(()=>window.scrollY)).toBe(0);
  expect(states.get(page)!.posts).toHaveLength(0);
});

test("UI-03 late Tab after closing the dialog is ignored without a runtime error",async({page})=>{
  await home(page);await close(page).click();const shell=page.locator("dialog[data-feedback-dialog]");
  await expect(shell).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>document.activeElement?.closest("dialog")===null)).toBe(true);
  const before=await page.evaluate(()=>({y:window.scrollY,active:document.activeElement?.tagName}));
  await shell.dispatchEvent("keydown",{key:"Tab"});
  expect(states.get(page)!.errors).toEqual([]);expect(await page.evaluate(()=>({y:window.scrollY,active:document.activeElement?.tagName}))).toEqual(before);
  await opener(page).click();await expect(dialog(page)).toBeVisible();await page.keyboard.press("Tab");await expect(close(page)).toBeFocused();
});

test("TIMER-01 immediate enabled invitation belongs to the actual homepage hero",async({page})=>{
  await home(page);expect(states.get(page)!.gets).toBe(1);expect(states.get(page)!.posts).toHaveLength(0);
  await expect(dialog(page).getByRole("heading",{name:NAME,exact:true})).toBeFocused();
  await close(page).click();await expect(opener(page)).toHaveCount(1);await expect(opener(page)).toBeInViewport();
  expect(await opener(page).evaluate(element=>!!element.closest("main > section:first-child"))).toBe(true);
  await expect(page.locator("main > div").filter({has:page.getByRole("button",{name:NAME,exact:true})})).toHaveCount(0);
});
test("TIMER-01 delayed config opens only once after a strict enabled response",async({page})=>{
  let release!:()=>Promise<void>;states.get(page)!.getHandler=route=>new Promise<void>(resolve=>{release=async()=>{await route.fulfill({json:campaign});resolve();};});
  await page.goto("/",{waitUntil:"domcontentloaded"});await expect.poll(()=>typeof release).toBe("function");await expect(dialog(page)).toBeHidden();
  await release();await expect(dialog(page)).toBeVisible();expect(states.get(page)!.gets).toBe(1);
});
for(const width of [390,1440])test(`UI-03 delayed campaign keeps the homepage hero layout stable at ${width}px`,async({page},info)=>{
  await page.setViewportSize({width,height:900});let release!:()=>Promise<void>;
  states.get(page)!.getHandler=route=>new Promise<void>(resolve=>{release=async()=>{await route.fulfill({json:campaign});resolve();};});
  await page.addInitScript(()=>{
    Reflect.set(window,"testLayoutShifts",[]);
    new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!Reflect.get(entry,"hadRecentInput"))(Reflect.get(window,"testLayoutShifts") as number[]).push(Reflect.get(entry,"value"));}).observe({type:"layout-shift",buffered:true});
  });
  await page.goto("/",{waitUntil:"domcontentloaded"});await expect.poll(()=>typeof release).toBe("function");
  await page.getByRole("heading",{level:1}).waitFor();await page.waitForTimeout(1000);
  const hero=page.locator("main > section").first(),before=await hero.boundingBox();await release();await expect(dialog(page)).toBeVisible();await close(page).click();
  const after=await hero.boundingBox();expect(after!.height).toBe(before!.height);expect(after!.width).toBe(before!.width);
  const shifts=await page.evaluate(()=>Reflect.get(window,"testLayoutShifts") as number[]);
  // Safari/Firefox do not expose Layout Instability entries: geometry remains
  // mandatory, and only supporting engines provide a measured CLS value.
  if(shifts.length)expect(shifts.reduce((sum,value)=>sum+value,0)).toBeLessThanOrEqual(.1);
  writeFileSync(info.outputPath("hero-layout-evidence.json"),JSON.stringify({before,after,shifts,layoutShiftSupported:await page.evaluate(()=>PerformanceObserver.supportedEntryTypes.includes("layout-shift"))}));
});
for(const config of ["disabled","malformed","unknown","403","503","non-json"])test(`TIMER-01 ${config} fails closed including the bounded next GET`,async({page})=>{
  const state=states.get(page)!;
  if(config==="disabled")state.config={...campaign,enabled:false};
  else if(config==="malformed")state.config={enabled:true};
  else if(config==="unknown")state.config={...campaign,enabled:"true"};
  else state.getHandler=route=>route.fulfill({status:config==="403"?403:config==="503"?503:200,body:"Unverified fixture response"});
  await page.clock.install();await page.goto("/",{waitUntil:"networkidle"});await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
  await expect(dialog(page)).toBeHidden();await expect(opener(page)).toHaveCount(0);expect(state.gets).toBe(1);
  await page.clock.fastForward(REOPEN_DELAY_MS);await expect.poll(()=>state.gets).toBe(2);await expect(dialog(page)).toBeHidden();expect(state.posts).toHaveLength(0);
});
for(const method of ["X","Escape"])test(`TIMER-02 ${method}: 119999ms closed, 120000ms fresh reopen, next cycle exact`,async({page})=>{
  await frozenHome(page);const state=states.get(page)!;
  for(let cycle=0;cycle<2;cycle++){
    if(method==="X")await close(page).click();else await page.keyboard.press("Escape");await expect(dialog(page)).toBeHidden();
    await page.clock.fastForward(REOPEN_DELAY_MS-1);await expect(dialog(page)).toBeHidden();expect(state.gets).toBe(cycle+1);
    await page.clock.fastForward(1);await expect(dialog(page)).toBeVisible();expect(state.gets).toBe(cycle+2);await expect(page.locator("dialog[open]")).toHaveCount(1);
  }
  expect(state.posts).toHaveLength(0);
});
test("TIMER-02 manual reopen cancels the old timer, keeps draft, and close restarts 120s",async({page})=>{
  await frozenHome(page);await page.getByRole("textbox",{name:"Email",exact:true}).fill("draft+keep@example.invalid");await close(page).click();await page.clock.fastForward(60_000);
  await opener(page).click();await page.clock.fastForward(60_000);await expect(dialog(page)).toBeVisible();expect(states.get(page)!.gets).toBe(1);
  await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue("draft+keep@example.invalid");await page.keyboard.press("Escape");await expect(opener(page)).toBeFocused();
  await page.clock.fastForward(REOPEN_DELAY_MS-1);await expect(dialog(page)).toBeHidden();await page.clock.fastForward(1);await expect(dialog(page)).toBeVisible();
  await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue("draft+keep@example.invalid");expect(states.get(page)!.posts).toHaveLength(0);
});
test("TIMER-03 simulated hidden visibility waits past deadline and opens once on foreground event",async({page})=>{
  await frozenHome(page);await close(page).click();
  await page.evaluate(()=>{Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"hidden"});document.dispatchEvent(new Event("visibilitychange"));});
  await page.clock.fastForward(REOPEN_DELAY_MS*10);await expect(dialog(page)).toBeHidden();expect(states.get(page)!.gets).toBe(1);
  await page.evaluate(()=>{Object.defineProperty(document,"visibilityState",{configurable:true,get:()=>"visible"});for(let i=0;i<10;i++)document.dispatchEvent(new Event("visibilitychange"));});
  await expect(dialog(page)).toBeVisible();expect(states.get(page)!.gets).toBe(2);await expect(page.locator("dialog[open]")).toHaveCount(1);
});
test("TIMER-03 another native dialog retains focus/draft until it closes, then one fresh invitation",async({page})=>{
  await frozenHome(page);await close(page).click();
  await page.evaluate(()=>{const d=document.createElement("dialog");d.id="another-dialog";d.setAttribute("aria-label","Local other form");const input=document.createElement("input");input.value="Other draft retained";d.append(input);document.body.append(d);d.showModal();input.focus();});
  await page.clock.fastForward(REOPEN_DELAY_MS);await expect(dialog(page)).toBeHidden();expect(states.get(page)!.gets).toBe(1);
  await expect(page.locator("#another-dialog input")).toBeFocused();await expect(page.locator("#another-dialog input")).toHaveValue("Other draft retained");
  await page.evaluate(()=>(document.getElementById("another-dialog") as HTMLDialogElement).close());await expect(dialog(page)).toBeVisible();expect(states.get(page)!.gets).toBe(2);
});
test("TIMER-03 mobile website menu defers the due invitation until Escape closes the menu",async({page})=>{
  await page.setViewportSize({width:390,height:844});await home(page);await close(page).click();await page.getByRole("button",{name:"Mở menu điều hướng",exact:true}).click();
  const menu=page.getByRole("dialog",{name:"Menu HomeMind",exact:true});await expect(menu).toBeVisible();
  // Date-only advancement models a throttled deadline without shifting the
  // browser's independent native WAAPI timeline used by the existing menu.
  await page.clock.setFixedTime(new Date(await page.evaluate(delay=>Date.now()+delay,REOPEN_DELAY_MS)));
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
  await expect(dialog(page)).toBeHidden();await expect(menu.getByRole("button",{name:"Đóng menu điều hướng",exact:true})).toBeFocused();
  await page.keyboard.press("Escape");await expect(menu).toBeHidden();await expect(dialog(page)).toBeVisible();expect(states.get(page)!.gets).toBe(2);
});
test("TIMER-03 route unmount clears deadline, legal never invites, returning/reload home is a new initial visit",async({page})=>{
  await frozenHome(page);await close(page).click();await page.getByRole("navigation",{name:"Điều hướng chính",exact:true}).getByRole("link",{name:"Chính sách",exact:true}).click();
  await expect(page).toHaveURL(/privacy-policy$/);await page.clock.fastForward(REOPEN_DELAY_MS*2);expect(states.get(page)!.gets).toBe(1);await expect(dialog(page)).toHaveCount(0);
  expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe("hidden");
  await page.getByRole("banner").getByRole("link",{name:"HomeMind — Trang chủ",exact:true}).click();await expect(dialog(page)).toBeVisible();expect(states.get(page)!.gets).toBe(2);
  await page.reload({waitUntil:"networkidle"});await expect(dialog(page)).toBeVisible();expect(states.get(page)!.gets).toBe(3);expect(states.get(page)!.posts).toHaveLength(0);
});
for(const path of ["/terms-of-service","/privacy-policy","/dang-nhap"])test(`TIMER-03 ${path} has no public timer/config invitation`,async({page})=>{
  await page.clock.install();await page.goto(path,{waitUntil:"networkidle"});await page.clock.fastForward(REOPEN_DELAY_MS*3);
  await expect(dialog(page)).toHaveCount(0);expect(states.get(page)!.gets).toBe(0);expect(states.get(page)!.posts).toHaveLength(0);
});
test("TIMER-04 success survives close and timed reopening; new submission is explicit with a fresh key",async({page})=>{
  await frozenHome(page);await fill(page);await send(page).dblclick();await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin",exact:true})).toBeVisible();
  const state=states.get(page)!;expect(state.posts).toHaveLength(1);await close(page).click();await page.clock.fastForward(REOPEN_DELAY_MS);
  await expect(dialog(page).getByRole("heading",{name:"Đã gửi thông tin",exact:true})).toBeVisible();expect(state.posts).toHaveLength(1);await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue(validDraft.email);
  await page.getByRole("button",{name:"Gửi lượt góp ý mới",exact:true}).click();expect(state.posts).toHaveLength(1);await send(page).click();await expect.poll(()=>state.posts.length).toBe(2);
  expect(state.posts[1].key).not.toBe(state.posts[0].key);expect(state.posts[1].body).toEqual(validDraft);
});
test("TIMER-04 timeout while closed stays uncertain after reopening; no autoPOST or false activation",async({page})=>{
  states.get(page)!.postHandler=()=>new Promise<void>(()=>{});await frozenHome(page);await fill(page);await send(page).click();await expect(page.getByRole("button",{name:"Đang gửi…",exact:true})).toBeDisabled();await close(page).click();
  await page.clock.fastForward(20_000);await page.clock.fastForward(REOPEN_DELAY_MS-20_000);await expect(dialog(page)).toBeVisible();
  await expect(dialog(page).getByRole("alert")).toContainText("Hệ thống có thể đã nhận");expect(states.get(page)!.posts).toHaveLength(1);await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue(validDraft.email);
  await expect(dialog(page)).not.toContainText("đã kích hoạt thành công");
});
for(const config of ["disabled","malformed"])test(`TIMER-04 reopen ${config} fresh config blocks stale invitation and preserves manual draft`,async({page})=>{
  await frozenHome(page);await page.getByRole("textbox",{name:"Email",exact:true}).fill("kept@example.invalid");await close(page).click();states.get(page)!.config=config==="disabled"?{...campaign,enabled:false}:{enabled:true};
  await page.clock.fastForward(REOPEN_DELAY_MS);await expect.poll(()=>states.get(page)!.gets).toBe(2);await expect(dialog(page)).toBeHidden();await opener(page).click();
  await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue("kept@example.invalid");await expect(send(page)).toBeDisabled();expect(states.get(page)!.posts).toHaveLength(0);
});
test("TIMER-04 late recheck cannot reopen a form manually opened/closed while config is pending",async({page})=>{
  await frozenHome(page);await close(page).click();let release!:()=>Promise<void>;
  states.get(page)!.getHandler=route=>new Promise<void>(resolve=>{release=async()=>{await route.fulfill({json:campaign});resolve();};});await page.clock.fastForward(REOPEN_DELAY_MS);await expect.poll(()=>typeof release).toBe("function");
  await opener(page).click();await close(page).click();await release();await expect(dialog(page)).toBeHidden();states.get(page)!.getHandler=undefined;
  await page.clock.fastForward(REOPEN_DELAY_MS-1);await expect(dialog(page)).toBeHidden();await page.clock.fastForward(1);await expect(dialog(page)).toBeVisible();expect(states.get(page)!.gets).toBe(3);
});

test("UI-01 heading keeps 30 Ngày first and Đặc Quyền together across widths and enlarged heading text",async({page},info)=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await home(page);
  await page.evaluate(()=>document.fonts.ready);
  const heading=dialog(page).getByRole("heading",{name:NAME,exact:true});
  const scenarios=[
    {width:320,height:720,textScale:1},{width:360,height:800,textScale:1},{width:390,height:844,textScale:1},
    {width:768,height:900,textScale:1},{width:900,height:900,textScale:1},{width:1024,height:768,textScale:1},
    {width:1440,height:900,textScale:1},{width:390,height:320,textScale:1},{width:768,height:390,textScale:1},
    {width:320,height:720,textScale:2},{width:390,height:844,textScale:2},{width:768,height:900,textScale:2},
    {width:900,height:900,textScale:2},{width:1024,height:768,textScale:2},{width:1440,height:900,textScale:2},
  ];
  for(const {width,height,textScale} of scenarios) await test.step(`${width}x${height} heading text ${textScale*100}%`,async()=>{
    await page.setViewportSize({width,height});
    await heading.evaluate((element,scale)=>{
      element.style.removeProperty("font-size");
      if(scale!==1)element.style.fontSize=`${parseFloat(getComputedStyle(element).fontSize)*scale}px`;
      element.closest("header")!.parentElement!.scrollTop=0;
    },textScale);
    const geometry=await heading.evaluate(element=>{
      const nodes:{node:Text;start:number;end:number}[]=[];
      const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
      let offset=0;
      while(walker.nextNode()){
        const node=walker.currentNode as Text;
        nodes.push({node,start:offset,end:offset+node.length});offset+=node.length;
      }
      const labels=["30 Ngày","Đặc Quyền","Đặc","Quyền","Premium"] as const;
      const ranges=Object.fromEntries(labels.map(label=>{
        const start=element.textContent!.indexOf(label),end=start+label.length;
        if(start<0)throw new Error(`Missing heading phrase: ${label}`);
        const first=nodes.find(entry=>start>=entry.start&&start<entry.end)!;
        const last=nodes.find(entry=>end>entry.start&&end<=entry.end)!;
        const range=document.createRange();
        range.setStart(first.node,start-first.start);range.setEnd(last.node,end-last.start);
        return [label,Array.from(range.getClientRects()).filter(rect=>rect.width>0&&rect.height>0).map(rect=>({left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height}))];
      }));
      const content=element.closest("header")!.parentElement!,clip=content.getBoundingClientRect();
      const style=getComputedStyle(element),box=element.getBoundingClientRect(),gift=element.previousElementSibling!.getBoundingClientRect();
      const leadLine=element.children[0].getBoundingClientRect(),detailLine=element.children[1].getBoundingClientRect();
      const detailLineHeight=parseFloat(getComputedStyle(element.children[1]).lineHeight);
      const paddingLeft=parseFloat(style.paddingLeft),paddingRight=parseFloat(style.paddingRight);
      const headingCenter=box.left+element.clientLeft+paddingLeft+(element.clientWidth-paddingLeft-paddingRight)/2;
      return {ranges,lineHeight:parseFloat(style.lineHeight),detailLineHeight,leadLine:{top:leadLine.top,bottom:leadLine.bottom},detailLine:{top:detailLine.top,bottom:detailLine.bottom},headingCenter,giftCenter:(gift.left+gift.right)/2,clip:{left:clip.left+content.clientLeft,right:clip.left+content.clientLeft+content.clientWidth},overflow:content.scrollWidth>content.clientWidth};
    });
    expect(Number.isFinite(geometry.lineHeight)).toBe(true);
    expect(Number.isFinite(geometry.detailLineHeight)&&Object.values(geometry.leadLine).every(Number.isFinite)&&Object.values(geometry.detailLine).every(Number.isFinite)).toBe(true);
    expect(geometry.overflow,"Popup content has no horizontal overflow").toBe(false);
    for(const [label,rects] of Object.entries(geometry.ranges)){
      expect(rects,`${label} occupies one intact line`).toHaveLength(1);
      const rect=rects[0];
      expect(Object.values(rect).every(Number.isFinite),`${label} has finite rendered geometry`).toBe(true);
      expect(rect.left,`${label} remains inside the scroll viewport`).toBeGreaterThanOrEqual(geometry.clip.left-1);
      expect(rect.right,`${label} remains inside the scroll viewport`).toBeLessThanOrEqual(geometry.clip.right+1);
    }
    const lead=geometry.ranges["30 Ngày"][0],phrase=geometry.ranges["Đặc Quyền"][0],premium=geometry.ranges.Premium[0];
    expect(Math.abs(geometry.ranges["Đặc"][0].top-geometry.ranges["Quyền"][0].top)).toBeLessThanOrEqual(1);
    expect(geometry.leadLine.bottom,"The heading line boxes do not overlap").toBeLessThanOrEqual(geometry.detailLine.top+1);
    expect(Math.abs(geometry.detailLine.top-geometry.leadLine.bottom),"The second heading line follows without an extra gap").toBeLessThanOrEqual(1);
    expect(Math.abs(phrase.top-geometry.detailLine.top),"Đặc Quyền starts in the first line of its measured text block").toBeLessThanOrEqual(Math.max(phrase.height,geometry.detailLineHeight)/2);
    if(textScale===1)
      expect(Math.abs(premium.top-phrase.top),"Premium shares the second line with Đặc Quyền at normal text size").toBeLessThanOrEqual(1);
    else
      expect(Math.min(Math.abs(premium.top-phrase.top),Math.abs(premium.top-phrase.top-geometry.detailLineHeight)),"Enlarged Premium fits the second or third line").toBeLessThanOrEqual(1);
    if(width>=900){
      const lowerLines=Math.abs(phrase.top-premium.top)<=1
        ? [{left:Math.min(phrase.left,premium.left),right:Math.max(phrase.right,premium.right)}]
        : [phrase,premium];
      for(const line of [lead,...lowerLines])
        expect(Math.abs((line.left+line.right)/2-geometry.headingCenter),"Desktop title lines share the heading content center").toBeLessThanOrEqual(1);
      expect(Number.isFinite(geometry.headingCenter)&&Number.isFinite(geometry.giftCenter)).toBe(true);
      expect(Math.abs(geometry.giftCenter-geometry.headingCenter),"Desktop gift and title share a center").toBeLessThanOrEqual(1);
    }
    await expect(heading).toHaveText(NAME);
    await expect(close(page)).toBeInViewport({ratio:1});await expect(send(page)).toBeInViewport({ratio:1});
    await page.screenshot({path:info.outputPath(`heading-${width}x${height}-text${textScale*100}.png`),animations:"disabled"});
    writeFileSync(info.outputPath(`heading-${width}x${height}-text${textScale*100}.json`),JSON.stringify(geometry,null,2));
    expect(states.get(page)!.posts,"Heading rendering sends no submission").toHaveLength(0);
  });
});

for(const [width,height] of [[320,720],[360,800],[390,844],[768,900],[1024,768],[1280,900],[1366,768],[1440,900],[1920,1080],[390,320],[768,390],[640,450]])test(`UI-01 layout ${width}x${height} with actual form, CTA and inspected screenshot`,async({page},info)=>{
  await page.setViewportSize({width,height});await home(page);await expect(close(page)).toBeInViewport();await expect(send(page)).toBeInViewport();
  const geometry=await dialog(page).evaluate(element=>{const hero=element.querySelector("header")!.getBoundingClientRect(),form=element.querySelector("form")!.getBoundingClientRect(),box=element.getBoundingClientRect();return {hero:{x:hero.x,y:hero.y,width:hero.width},form:{x:form.x,y:form.y,width:form.width},box:{width:box.width,height:box.height},overflow:element.scrollWidth>element.clientWidth,rootOverflow:document.documentElement.scrollWidth>innerWidth};});
  expect(geometry.overflow).toBe(false);expect(geometry.rootOverflow).toBe(false);expect(geometry.box.width).toBeLessThanOrEqual(1000);expect(geometry.box.height).toBeLessThanOrEqual(height-24);
  if(width>=900){expect(geometry.form.x).toBeGreaterThan(geometry.hero.x+geometry.hero.width-1);expect(geometry.hero.width/geometry.box.width).toBeGreaterThan(.35);expect(geometry.hero.width/geometry.box.width).toBeLessThan(.42);await expect(page.getByRole("textbox",{name:"Email",exact:true})).toBeInViewport();}
  else expect(geometry.form.y).toBeGreaterThan(geometry.hero.y);
  await page.screenshot({path:info.outputPath(`redesign-initial-${width}x${height}.png`),animations:"disabled"});
  await page.getByRole("textbox",{name:"Góp ý của bạn",exact:true}).fill("Góp ý dài tiếng Việt và Unicode 👪. ".repeat(30));await expect(send(page)).toBeInViewport();await expect(close(page)).toBeInViewport();
  await page.screenshot({path:info.outputPath(`redesign-form-${width}x${height}.png`),animations:"disabled"});
  await close(page).click();await page.screenshot({path:info.outputPath(`redesign-hero-${width}x${height}.png`),animations:"disabled"});
});
test("UI-02 exact copy, required asterisks/semantics, concise steps and safe legal links",async({page})=>{
  await home(page);await expect(dialog(page)).toContainText(rewardPolicy);await expect(dialog(page)).not.toContainText("Cả bốn trường đều bắt buộc");
  await expect(dialog(page).getByText("Chia sẻ góp ý của bạn để đăng ký trải nghiệm HomeMind Premium.",{exact:true})).toBeVisible();
  const stars=dialog(page).locator('form label span[aria-hidden="true"]');await expect(stars).toHaveCount(4);for(const star of await stars.all()){await expect(star).toHaveText("*");await expect(star).toHaveCSS("color","rgb(185, 28, 28)");}
  for(const label of ["Họ và tên","Số điện thoại","Email","Góp ý của bạn"]){const field=page.getByRole("textbox",{name:label,exact:true});await expect(field).toHaveAttribute("required","");await expect(field).toHaveAttribute("aria-required","true");await expect(field).toHaveCSS("font-size","16px");}
  await page.locator("summary").click();await expect(page.locator("summary").locator("..").locator("li")).toHaveCount(3);
  for(const [label,href] of [["Điều khoản chương trình","/terms-of-service#premium-30-ngay"],["Chính sách bảo mật","/privacy-policy#gop-y-nhan-qua-premium"]]){const link=dialog(page).getByRole("link",{name:new RegExp(label)});await expect(link).toHaveAttribute("href",href);await expect(link).toHaveAttribute("target","_blank");await expect(link).toHaveAttribute("rel","noopener noreferrer");}
});
test("UI-03 animation duration is bounded and reduced-motion disables popup/CTA effects",async({page})=>{
  await home(page);await expect(dialog(page)).toHaveCSS("animation-duration","0.2s");await close(page).click();await page.emulateMedia({reducedMotion:"reduce"});await opener(page).click();
  await expect(dialog(page)).toHaveCSS("animation-name","none");await expect(dialog(page)).toHaveCSS("transform","none");
  const transitions=await dialog(page).locator("input,textarea,button").evaluateAll(elements=>elements.map(element=>getComputedStyle(element).transitionDuration));expect(transitions.every(value=>value==="0s")).toBe(true);
  await page.getByRole("textbox",{name:"Họ và tên",exact:true}).fill("Nguyễn An");await expect(page.getByRole("textbox",{name:"Họ và tên",exact:true})).toHaveValue("Nguyễn An");
});
test("UI-03 keyboard trap, field alerts, close focus return and exact scroll restore over repeated cycles",async({page})=>{
  await home(page);await close(page).click();await opener(page).focus();await page.keyboard.press("Enter");await page.keyboard.press("Tab");await expect(close(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");await expect(send(page)).toBeFocused();await page.keyboard.press("Tab");await expect(close(page)).toBeFocused();
  await send(page).click();await expect(page.getByRole("textbox",{name:"Họ và tên",exact:true})).toBeFocused();await expect(dialog(page).getByRole("alert")).toHaveCount(4);
  for(let i=0;i<10;i++){await page.keyboard.press("Escape");await expect(opener(page)).toBeFocused();expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe("hidden");await opener(page).click();expect(await page.evaluate(()=>document.body.style.overflow)).toBe("hidden");}
});
test("UI-03 visualViewport keyboard-like resize keeps close/CTA and internal scroll accessible",async({page},info)=>{
  await page.setViewportSize({width:390,height:844});await home(page);await fill(page);
  await page.evaluate(()=>{Object.defineProperty(visualViewport!,"height",{configurable:true,get:()=>320});Object.defineProperty(visualViewport!,"offsetTop",{configurable:true,get:()=>80});visualViewport!.dispatchEvent(new Event("resize"));});
  const box=(await dialog(page).boundingBox())!;expect(box.y).toBeGreaterThanOrEqual(92);expect(box.y+box.height).toBeLessThanOrEqual(388);
  const content=dialog(page).locator('[data-lenis-prevent]').first();
  expect(await content.evaluate(element=>element.scrollHeight>element.clientHeight)).toBe(true);
  // The simulated keyboard resize does not include the OS's automatic focus
  // scrolling. Verify the actual form remains reachable through its own scroll.
  await page.getByRole("textbox",{name:"Góp ý của bạn",exact:true}).scrollIntoViewIfNeeded();
  await expect(page.getByRole("textbox",{name:"Góp ý của bạn",exact:true})).toBeInViewport();
  await expect(close(page)).toBeInViewport();await expect(send(page)).toBeInViewport();await page.screenshot({path:info.outputPath("redesign-keyboard-390.png"),animations:"disabled"});
});
test("UI-03 text/required/focus/CTA palette meets AA",async({page})=>{
  await home(page);
  const ratio=(a:number[],b:number[])=>{const luminance=(c:number[])=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  const colors=await dialog(page).evaluate(element=>{
    // Tailwind 4 serializes brand colors as lab(), not necessarily rgb().
    // Read the actual rendered colors through the browser's sRGB canvas.
    const canvas=document.createElement("canvas"),context=canvas.getContext("2d")!;canvas.width=canvas.height=1;
    const rgb=(color:string)=>{context.clearRect(0,0,1,1);context.fillStyle=color;context.fillRect(0,0,1,1);return Array.from(context.getImageData(0,0,1,1).data).slice(0,3);};
    const button=getComputedStyle(element.querySelector("footer button")!),star=getComputedStyle(element.querySelector('label span[aria-hidden="true"]')!),policy=getComputedStyle(element.querySelector("header > p:last-of-type")!),header=getComputedStyle(element.querySelector("header")!);
    return {button:[rgb(button.color),rgb(button.backgroundColor)],star:[rgb(star.color),rgb("white")],policy:[rgb(policy.color),rgb(header.backgroundColor)]};
  });
  for(const pair of Object.values(colors))expect(ratio(pair[0],pair[1])).toBeGreaterThan(4.5);
  await page.getByRole("textbox",{name:"Email",exact:true}).focus();await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveCSS("outline-style","solid");
});
for(const [path,anchor,title] of [["/terms-of-service","premium-30-ngay","Điều khoản sử dụng"],["/privacy-policy","gop-y-nhan-qua-premium","Chính sách bảo mật"]])test(`LEGAL-01 ${path} direct anchor/reload and existing rights/contact preserved`,async({page},info)=>{
  const response=await page.goto(`${path}#${anchor}`,{waitUntil:"networkidle"});expect(response!.status()).toBe(200);await expect(page.locator(`#${anchor} h2`)).toBeInViewport();await expect(page.getByRole("heading",{level:1,name:title,exact:true})).toBeVisible();
  expect(await page.locator("article section").count()).toBeGreaterThanOrEqual(16);await page.reload({waitUntil:"networkidle"});await expect(page.locator(`#${anchor} h2`)).toBeInViewport();
  await expect(page.locator(`#${anchor}`)).toContainText(path.includes("terms")?"2.592.000 giây":"fullName");await expect(page.locator('#lien-he a[href="mailto:homemind.support@gmail.com"]')).toHaveCount(1);
  await page.screenshot({path:info.outputPath(`legal-${anchor}.png`),animations:"disabled"});expect(states.get(page)!.gets).toBe(0);
});
test("LEGAL-01 native legal fragments do not inherit homepage smooth-scroll timing",async({page})=>{
  await page.goto("/privacy-policy#gop-y-nhan-qua-premium",{waitUntil:"networkidle"});
  await expect(page.locator("html")).toHaveCSS("scroll-behavior","auto");
  await expect(page.locator("#gop-y-nhan-qua-premium h2")).toBeInViewport();
  await page.getByRole("navigation",{name:"Mục lục",exact:true}).getByRole("link",{name:/Liên hệ HomeMind/}).click();
  await expect(page.locator("#lien-he h2")).toBeInViewport();
  await page.goto("/terms-of-service#premium-30-ngay",{waitUntil:"networkidle"});
  await expect(page.locator("html")).toHaveCSS("scroll-behavior","auto");
  await expect(page.locator("#premium-30-ngay h2")).toBeInViewport();
  await home(page);await close(page).click();await expect(page.locator("html")).toHaveCSS("scroll-behavior","smooth");
});
test("LEGAL-01 new-tab terms/privacy preserve the form draft and safe focus on return",async({page,context})=>{
  await home(page);await fill(page);
  for(const label of ["Điều khoản chương trình","Chính sách bảo mật"]){const link=dialog(page).getByRole("link",{name:new RegExp(label)});await link.focus();const popup=context.waitForEvent("page");await link.click();const legal=await popup;await legal.waitForLoadState("networkidle");expect(await legal.evaluate(()=>window.opener)).toBeNull();await legal.close();await page.bringToFront();await expect(dialog(page)).toBeVisible();await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue(validDraft.email);}
  expect(states.get(page)!.posts).toHaveLength(0);
});
test("PRIVACY-01 user input remains escaped text with no PII in storage, URL, or automatic requests",async({page})=>{
  await frozenHome(page);await page.getByRole("textbox",{name:"Góp ý của bạn",exact:true}).fill('<img src=x onerror="window.piiLeak=true"> Góp ý 👪');await close(page).click();await page.clock.fastForward(REOPEN_DELAY_MS);
  await expect(page.getByRole("textbox",{name:"Góp ý của bạn",exact:true})).toHaveValue('<img src=x onerror="window.piiLeak=true"> Góp ý 👪');expect(await page.evaluate(()=>({leak:Reflect.get(window,"piiLeak"),local:{...localStorage},session:{...sessionStorage}}))).toEqual({leak:undefined,local:{},session:{}});
  expect(states.get(page)!.posts).toHaveLength(0);expect(page.url()).not.toContain("onerror");
  // The intentional brand mark is the only permitted image. Keep the XSS
  // boundary strict: no scripts/inline handlers and no extra injected image.
  await expect(dialog(page).locator("script,img[onerror]")).toHaveCount(0);
  const mark=dialog(page).getByText("HomeMind Premium",{exact:true}).locator("img");
  await expect(dialog(page).locator("img")).toHaveCount(1);await expect(mark).toHaveCount(1);await expect(mark).toHaveAttribute("alt","");
  const source=(src:string)=>new URL(src,page.url()).searchParams.get("url");
  const navbar=page.getByRole("link",{name:"HomeMind — Trang chủ",exact:true}).first().locator("img");
  const trusted=source((await navbar.getAttribute("src"))!);expect(trusted).toMatch(/^\/_next\/static\/media\/logo\.[A-Za-z0-9_-]+\.png$/);
  expect(source((await mark.getAttribute("src"))!)).toBe(trusted);
});

for(const code of ["VALIDATION_ERROR","RATE_LIMITED"])test(`TIMER-04 ${code} survives timed reopening without automatic retry or draft reset`,async({page})=>{
  const state=states.get(page)!;
  state.postHandler=route=>route.fulfill({status:code==="RATE_LIMITED"?429:400,headers:{"Retry-After":"1"},json:{error:{code,details:[{field:"review",code:"INVALID_FORMAT"}]}}});
  await frozenHome(page);await fill(page);await send(page).click();await expect(dialog(page).getByRole("alert").first()).toBeVisible();expect(state.posts).toHaveLength(1);
  await close(page).click();await page.clock.fastForward(REOPEN_DELAY_MS);await expect(dialog(page)).toBeVisible();await expect(dialog(page).getByRole("alert").first()).toBeVisible();
  await expect(page.getByRole("textbox",{name:"Email",exact:true})).toHaveValue(validDraft.email);expect(state.posts).toHaveLength(1);
  await page.getByRole("button",{name:"Gửi lượt góp ý mới",exact:true}).click();expect(state.posts).toHaveLength(1);await send(page).click();await expect.poll(()=>state.posts.length).toBe(2);
  expect(state.posts[1].key).not.toBe(state.posts[0].key);expect(state.posts[1].body).toEqual(validDraft);
});
