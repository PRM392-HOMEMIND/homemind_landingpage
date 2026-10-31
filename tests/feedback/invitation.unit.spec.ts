import { test, expect } from "@playwright/test";
import { FeedbackInvitations, REOPEN_DELAY_MS, startFeedbackInvitations, type InvitationEnvironment } from "../../src/features/feedback/invitation";
import { FeedbackSession } from "../../src/features/feedback/session";

const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
class Clock implements InvitationEnvironment {
  time = 0; safe = true; serial = 0;
  tasks = new Map<ReturnType<typeof setTimeout>, { at: number; action: () => void }>();
  now = () => this.time;
  safeToOpen = () => this.safe;
  prepareInitialOpen = () => {};
  schedule = (action: () => void, delay: number) => { const id = ++this.serial as unknown as ReturnType<typeof setTimeout>; this.tasks.set(id, { at: this.time + delay, action }); return id; };
  cancel = (timer: ReturnType<typeof setTimeout>) => { this.tasks.delete(timer); };
  async advance(ms: number) {
    const end = this.time + ms;
    while (true) {
      const next = [...this.tasks].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      this.time = next[1].at; this.tasks.delete(next[0]); next[1].action(); await settle();
    }
    this.time = end; await settle();
  }
}
function fixture() {
  let availability = "enabled", gets = 0, posts = 0;
  let read: (() => Promise<"enabled" | "disabled">) | undefined;
  const session = new FeedbackSession<string>({
    loadCampaign: () => { gets++; return read ? read() : Promise.resolve(availability as "enabled" | "disabled"); },
    submit: async () => { posts++; return "submitted"; },
  });
  const clock = new Clock(); const invitations = new FeedbackInvitations(session, clock);
  return { session, clock, invitations, set: (value: string) => { availability = value; }, read: (fn: typeof read) => { read = fn; }, gets: () => gets, posts: () => posts };
}

test("enabled immediately opens after the fresh GET without a timer or POST", async () => {
  const f = fixture(); f.invitations.start(); expect(f.session.getSnapshot().open).toBe(false); await settle();
  expect(f.session.getSnapshot().open).toBe(true); expect(f.gets()).toBe(1); expect(f.posts()).toBe(0); expect(f.clock.tasks.size).toBe(0);
  f.invitations.start(); f.invitations.wake(); await settle(); expect(f.gets()).toBe(1); f.invitations.stop(); f.session.dispose();
});

test("initial navigation is prepared once after safety is restored, never on a later invitation", async () => {
  const f=fixture();let preparations=0;
  f.clock.prepareInitialOpen=()=>{expect(f.session.getSnapshot().open).toBe(false);preparations++;};
  f.clock.safe=false;f.invitations.start();await settle();expect(preparations).toBe(0);
  f.clock.safe=true;f.invitations.wake();await settle();expect(preparations).toBe(1);
  f.session.close();await f.clock.advance(REOPEN_DELAY_MS);expect(preparations).toBe(1);
  f.invitations.stop();f.session.dispose();
});

test("manual first opening prevents initial navigation preparation on a later automatic opening",async()=>{
  const f=fixture();let preparations=0;f.clock.prepareInitialOpen=()=>{preparations++;};
  f.clock.safe=false;f.invitations.start();await settle();f.session.open();f.session.close();f.clock.safe=true;
  await f.clock.advance(REOPEN_DELAY_MS);expect(preparations).toBe(0);expect(f.session.getSnapshot().open).toBe(true);
  f.invitations.stop();f.session.dispose();
});

for(const [hash,id] of [["",undefined],["#features","features"],["#g%C3%B3p-%C3%BD","góp-ý"],["#missing",undefined],["#%E0%A4",undefined]] as const)
test(`DOM initial fragment ${hash || "empty"} is resolved safely before opening`,async()=>{
  const original=globalThis.MutationObserver,f=fixture();let scrolled=0;
  const doc={body:{},visibilityState:"visible",hasFocus:()=>true,querySelectorAll:()=>[],
    getElementById:(value:string)=>value===id?{scrollIntoView:(options:ScrollIntoViewOptions)=>{
      expect(f.session.getSnapshot().open).toBe(false);expect(options).toEqual({behavior:"instant",block:"start"});scrolled++;
    }}:null,addEventListener:()=>{},removeEventListener:()=>{}} as unknown as Document;
  const win={location:{pathname:"/",hash},addEventListener:()=>{},removeEventListener:()=>{}} as unknown as Window;
  globalThis.MutationObserver=class{observe(){} disconnect(){}} as unknown as typeof MutationObserver;
  try{const stop=startFeedbackInvitations(f.session,doc,win);await settle();expect(f.session.getSnapshot().open).toBe(true);
    expect(scrolled).toBe(id?1:0);stop();
  }finally{globalThis.MutationObserver=original;f.session.dispose();}
});
test("delayed initial GET is fail closed until verified", async () => {
  const f = fixture(), d = deferred<"enabled">(); f.read(() => d.promise); f.invitations.start(); await settle();
  expect(f.session.getSnapshot().open).toBe(false); f.invitations.wake(); expect(f.gets()).toBe(1);
  d.resolve("enabled"); await settle(); expect(f.session.getSnapshot().open).toBe(true); f.invitations.stop(); f.session.dispose();
});
for (const status of ["disabled", "unavailable", "unknown"]) test(`initial ${status} stays closed; bounded GET recovery respects 120s`, async () => {
  const f = fixture(); f.set(status); f.invitations.start(); await settle(); expect(f.session.getSnapshot().open).toBe(false);
  await f.clock.advance(REOPEN_DELAY_MS - 1); expect(f.gets()).toBe(1); f.set("enabled"); await f.clock.advance(1);
  expect(f.gets()).toBe(2); expect(f.session.getSnapshot().open).toBe(true); expect(f.posts()).toBe(0); f.invitations.stop(); f.session.dispose();
});
test("failed config request never opens; next GET is bounded", async () => {
  const f = fixture(); f.read(async () => { throw new Error("Fixture unavailable"); }); f.invitations.start(); await settle();
  expect(f.session.getSnapshot().campaign).toBe("unavailable"); expect(f.session.getSnapshot().open).toBe(false);
  for (let i=0; i<20; i++) f.invitations.wake(); expect(f.clock.tasks.size).toBe(1); expect(f.gets()).toBe(1);
  f.read(undefined); await f.clock.advance(REOPEN_DELAY_MS); expect(f.session.getSnapshot().open).toBe(true); f.invitations.stop(); f.session.dispose();
});
test("every close has exact 119999/120000 boundary and one fresh GET", async () => {
  const f=fixture(); f.invitations.start(); await settle();
  for (let cycle=0; cycle<5; cycle++) {
    f.session.close(); for(let i=0;i<10;i++) f.invitations.wake(); expect(f.clock.tasks.size).toBe(1);
    await f.clock.advance(REOPEN_DELAY_MS-1); expect(f.session.getSnapshot().open).toBe(false); expect(f.gets()).toBe(cycle+1);
    await f.clock.advance(1); expect(f.session.getSnapshot().open).toBe(true); expect(f.gets()).toBe(cycle+2); expect(f.clock.tasks.size).toBe(0);
  }
  expect(f.posts()).toBe(0); f.invitations.stop(); f.session.dispose();
});
test("manual open cancels the old deadline and a later close starts a new one", async () => {
  const f=fixture(); f.invitations.start(); await settle(); f.session.close(); await f.clock.advance(60_000); f.session.open();
  expect(f.clock.tasks.size).toBe(0); await f.clock.advance(60_000); expect(f.gets()).toBe(1);
  f.session.close(); await f.clock.advance(REOPEN_DELAY_MS-1); expect(f.session.getSnapshot().open).toBe(false);
  await f.clock.advance(1); expect(f.session.getSnapshot().open).toBe(true); f.invitations.stop(); f.session.dispose();
});
test("a repeated close while already closed does not create an extra timer", async () => {
  const f=fixture(); f.invitations.start(); await settle(); f.session.close(); await f.clock.advance(60_000); f.session.close();
  await f.clock.advance(60_000); expect(f.session.getSnapshot().open).toBe(true); expect(f.gets()).toBe(2); f.invitations.stop(); f.session.dispose();
});
for (const reason of ["hidden", "lost focus", "another dialog", "another route"]) test(`${reason} defers an expired invitation without polling; one foreground open`, async () => {
  const f=fixture(); f.invitations.start(); await settle(); f.session.close(); f.clock.safe=false;
  await f.clock.advance(REOPEN_DELAY_MS*10); expect(f.session.getSnapshot().open).toBe(false); expect(f.gets()).toBe(1); expect(f.clock.tasks.size).toBe(0);
  f.clock.safe=true; for(let i=0;i<30;i++) f.invitations.wake(); await settle(); expect(f.gets()).toBe(2); expect(f.session.getSnapshot().open).toBe(true);
  f.invitations.stop(); f.session.dispose();
});
test("initial hidden tab reads configuration but waits for a fresh foreground check", async () => {
  const f=fixture(); f.clock.safe=false; f.invitations.start(); await settle(); expect(f.gets()).toBe(1); expect(f.session.getSnapshot().open).toBe(false);
  f.set("disabled"); f.clock.safe=true; f.invitations.wake(); await settle(); expect(f.gets()).toBe(2); expect(f.session.getSnapshot().open).toBe(false);
  f.invitations.stop(); f.session.dispose();
});

test("safety is revalidated at the config check boundary after a due wake", async () => {
  const f=fixture();f.invitations.start();await settle();f.session.close();
  let reads=0;f.clock.safeToOpen=()=>++reads===1;
  await f.clock.advance(REOPEN_DELAY_MS);
  expect(reads).toBe(2);expect(f.gets()).toBe(1);expect(f.session.getSnapshot().open).toBe(false);expect(f.clock.tasks.size).toBe(0);
  f.clock.safeToOpen=()=>true;f.invitations.wake();await settle();expect(f.session.getSnapshot().open).toBe(true);expect(f.gets()).toBe(2);
  f.invitations.stop();f.session.dispose();
});
test("eligibility lost during a GET defers, then reads fresh config on wake", async () => {
  const f=fixture(), d=deferred<"enabled">(); f.read(()=>d.promise); f.invitations.start(); f.clock.safe=false; d.resolve("enabled"); await settle();
  expect(f.session.getSnapshot().open).toBe(false); expect(f.gets()).toBe(1); f.read(undefined); f.clock.safe=true; f.invitations.wake(); await settle();
  expect(f.gets()).toBe(2); expect(f.session.getSnapshot().open).toBe(true); f.invitations.stop(); f.session.dispose();
});
test("manual open/close while recheck pending invalidates its late response and preserves new deadline", async () => {
  const f=fixture(); f.invitations.start(); await settle(); f.session.close(); const d=deferred<"enabled">(); f.read(()=>d.promise);
  await f.clock.advance(REOPEN_DELAY_MS); f.session.open(); f.session.close(); d.resolve("enabled"); await settle(); expect(f.session.getSnapshot().open).toBe(false);
  expect(f.clock.tasks.size).toBe(1); f.read(undefined); await f.clock.advance(REOPEN_DELAY_MS-1); expect(f.session.getSnapshot().open).toBe(false);
  await f.clock.advance(1); expect(f.session.getSnapshot().open).toBe(true); f.invitations.stop(); f.session.dispose();
});
test("stop cancels timer/subscription; late initial GET cannot open; stopped start is inert", async () => {
  const f=fixture(), d=deferred<"enabled">(); f.read(()=>d.promise); f.invitations.start(); f.invitations.stop(); f.invitations.start(); d.resolve("enabled"); await settle();
  expect(f.session.getSnapshot().open).toBe(false); f.session.open(); f.session.close(); f.invitations.wake(); await f.clock.advance(REOPEN_DELAY_MS);
  expect(f.clock.tasks.size).toBe(0); expect(f.gets()).toBe(1); f.session.dispose();
});
test("stop removes a scheduled timeout; StrictMode replacement opens once with a new owner", async () => {
  const f=fixture(); f.invitations.start(); await settle(); f.session.close(); f.invitations.stop(); expect(f.clock.tasks.size).toBe(0);
  const replacement=new FeedbackInvitations(f.session,f.clock); replacement.start(); await settle(); expect(f.session.getSnapshot().open).toBe(true);
  expect(f.gets()).toBe(2); replacement.stop(); f.session.dispose();
});
test("success and draft operation remain intact after the timed invitation; no automatic submission", async () => {
  const f=fixture(); f.invitations.start(); await settle(); await f.session.submit("Original draft"); f.session.close();
  await f.clock.advance(REOPEN_DELAY_MS); expect(f.session.getSnapshot().submission).toBe("submitted"); expect(f.session.getSnapshot().open).toBe(true); expect(f.posts()).toBe(1);
  f.session.newSubmission(); expect(f.posts()).toBe(1); await f.session.submit("Intentional next draft"); expect(f.posts()).toBe(2); f.invitations.stop(); f.session.dispose();
});
test("fresh disabled recheck does not clear success or open using an old enabled value", async () => {
  const f=fixture(); f.invitations.start(); await settle(); await f.session.submit("Draft"); f.session.close(); f.set("disabled"); await f.clock.advance(REOPEN_DELAY_MS);
  expect(f.session.getSnapshot().open).toBe(false); expect(f.session.getSnapshot().submission).toBe("submitted"); expect(f.posts()).toBe(1);
  f.invitations.stop(); f.session.dispose();
});
test("starting with an open session does not fetch or duplicate its modal", async () => {
  const f=fixture(); await f.session.refreshCampaign(); f.session.open(); f.invitations.start(); f.invitations.wake(); await settle();
  expect(f.gets()).toBe(1); f.session.close(); await f.clock.advance(REOPEN_DELAY_MS); expect(f.gets()).toBe(2); f.invitations.stop(); f.session.dispose();
});

test("DOM owner excludes other dialogs, background/route/focus; duplicate mount and cleanup own all listeners", async () => {
  const original=globalThis.MutationObserver; const observers: { callback: () => void; disconnected: boolean }[]=[];
  const listeners=new Map<string,()=>void>(); let visible="visible", focused=true, path="/", elements: HTMLElement[]=[];
  const doc={ body:{}, get visibilityState(){return visible;}, hasFocus:()=>focused, querySelectorAll:()=>elements, addEventListener:(name:string, fn:()=>void)=>listeners.set(name,fn), removeEventListener:(name:string)=>listeners.delete(name) } as unknown as Document;
  const win={location:{get pathname(){return path;}},addEventListener:(name:string,fn:()=>void)=>listeners.set(name,fn),removeEventListener:(name:string)=>listeners.delete(name)} as unknown as Window;
  globalThis.MutationObserver=class { item:{callback:()=>void;disconnected:boolean}; constructor(callback:()=>void){this.item={callback,disconnected:false};observers.push(this.item);} observe(){} disconnect(){this.item.disconnected=true;} } as unknown as typeof MutationObserver;
  const f=fixture(), g=fixture();
  const element=(own:boolean,hidden:boolean,rects:number)=>({hasAttribute:()=>own,getAttribute:()=>hidden?"true":null,getClientRects:()=>Array(rects)}) as unknown as HTMLElement;
  try {
    elements=[element(false,false,1)]; const stop=startFeedbackInvitations(f.session,doc,win), duplicate=startFeedbackInvitations(g.session,doc,win); await settle();
    expect(f.session.getSnapshot().open).toBe(false); expect(f.gets()).toBe(1); expect(g.gets()).toBe(0); expect(listeners.size).toBe(3); expect(observers).toHaveLength(1);
    for(const condition of ["hidden","blurred","legal"]){ visible=condition==="hidden"?"hidden":"visible";focused=condition!=="blurred";path=condition==="legal"?"/privacy-policy":"/";elements=[];listeners.get("visibilitychange")!();await settle();expect(f.gets()).toBe(1); }
    visible="visible";focused=true;path="/";elements=[element(true,false,1),element(false,true,1),element(false,false,0)];observers[0].callback();await settle();expect(f.session.getSnapshot().open).toBe(true);expect(f.gets()).toBe(2);
    f.session.close();stop();duplicate(); expect(listeners.size).toBe(0); expect(observers[0].disconnected).toBe(true);
    const stopNew=startFeedbackInvitations(g.session,doc,win);await settle();expect(g.session.getSnapshot().open).toBe(true);stopNew();expect(listeners.size).toBe(0);
  } finally { globalThis.MutationObserver=original; f.session.dispose();g.session.dispose(); }
});
