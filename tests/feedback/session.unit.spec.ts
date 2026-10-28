import { expect, test } from "@playwright/test";
import { FeedbackSession } from "../../src/features/feedback/session";
import { FeedbackSubmissionError, feedbackIntegrationStatus, type FeedbackAdapter } from "../../src/features/feedback/adapter";

// Synthetic UI values. None of these fixtures is a public API DTO/response.
type Draft = { syntheticText: string };
const draft = { syntheticText: "Tiếng Việt e\u0301 + <b>kiểm thử</b>" };

test("same-operation manual retry preserves payload, new operation remains explicit", async () => {
  const seen: Draft[]=[];let accepted=false;let enabled=true;
  const session=new FeedbackSession(fixture({loadCampaign:async()=>enabled?"enabled":"disabled",submit:async(value)=>{seen.push(value);if(!accepted)throw new Error("lost response");return "submitted";}}));
  await session.refreshCampaign();await session.submit(draft);expect(session.getSnapshot().submission).toBe("uncertain");
  enabled=false;await session.retrySubmission();expect(session.getSnapshot().submission).toBe("uncertain");expect(seen).toEqual([draft]);
  enabled=true;await session.refreshCampaign();accepted=true;await session.retrySubmission();expect(session.getSnapshot().submission).toBe("submitted");expect(seen).toEqual([draft,draft]);
  await session.retrySubmission();expect(seen).toHaveLength(2);session.newSubmission();await session.retrySubmission();expect(seen).toHaveLength(2);await session.submit({syntheticText:"new"});expect(seen).toHaveLength(3);session.dispose();
});
test("rate cooldown survives new operation and finishes without render-time clock",async()=>{
  let calls=0;const session=new FeedbackSession(fixture({submit:async()=>{calls++;if(calls===1)throw new FeedbackSubmissionError("RATE_LIMITED",{},Date.now()+100);return "submitted";}}));
  await session.refreshCampaign();await session.submit(draft);expect(session.getSnapshot().cooling).toBe(true);
  await session.retrySubmission();expect(calls).toBe(1);session.newSubmission();await session.submit(draft);expect(calls).toBe(1);
  await expect.poll(()=>session.getSnapshot().cooling).toBe(false);await session.submit(draft);expect(calls).toBe(2);session.dispose();
});
test("retry denied during operation, unavailable precheck preserves uncertain identity, disabled rejection",async()=>{
  let unavailable=false;let mode="lost";let release!:()=>void;
  const session=new FeedbackSession(fixture({loadCampaign:async()=>{if(unavailable)throw new Error();return "enabled";},submit:async()=>{if(mode==="lost")throw new Error();if(mode==="disabled")throw new FeedbackSubmissionError("FEEDBACK_POPUP_DISABLED");await new Promise<void>(resolve=>{release=resolve;});return "submitted";}}));
  await session.refreshCampaign();await session.retrySubmission();await session.submit(draft);unavailable=true;await session.retrySubmission();expect(session.getSnapshot().submission).toBe("uncertain");
  unavailable=false;await session.refreshCampaign();mode="wait";const pending=session.retrySubmission();await expect.poll(()=>session.getSnapshot().submission).toBe("sending");await session.retrySubmission();release();await pending;
  session.newSubmission();mode="disabled";await session.submit(draft);expect(session.getSnapshot().campaign).toBe("disabled");session.dispose();await session.retrySubmission();
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture(overrides: Partial<FeedbackAdapter<Draft>> = {}): FeedbackAdapter<Draft> {
  return { loadCampaign: async () => "enabled", submit: async () => "submitted", ...overrides };
}

test("unconfigured production boundary fails closed and performs no operation", async () => {
  expect(feedbackIntegrationStatus).toBe("RELEASED_API_233e715");
  const session = new FeedbackSession<Draft>();
  session.open();
  await session.refreshCampaign();
  await session.submit(draft);
  expect(session.getSnapshot()).toEqual({ campaign: "pending-contract", submission: "idle", open: false, visited: false });
  session.dispose();
  await session.refreshCampaign();
  await session.submit(draft);
  session.newSubmission();
  session.close();
});

for (const value of ["enabled", "disabled", undefined, null, true, { enabled: true }, "ENABLED"]) {
  test(`config abstraction safely handles ${JSON.stringify(value)}`, async () => {
    let calls = 0;
    const session = new FeedbackSession(fixture({ loadCampaign: async () => value as "enabled", submit: async () => { calls++; return "submitted"; } }));
    expect(session.getSnapshot().campaign).toBe("loading");
    session.open();
    expect(session.getSnapshot().open).toBe(false);
    await session.refreshCampaign();
    session.open();
    expect(session.getSnapshot().campaign).toBe(value === "enabled" || value === "disabled" ? value : "unavailable");
    expect(session.getSnapshot().open).toBe(value === "enabled");
    await session.submit(draft);
    expect(calls).toBe(value === "enabled" ? 1 : 0);
    session.dispose();
  });
}

test("config failures and timeouts recover only through an intentional read", async () => {
  let fail = true;
  const session = new FeedbackSession(fixture({ loadCampaign: async () => { if (fail) throw new Error("untrusted text"); return "enabled"; } }));
  await session.refreshCampaign();
  expect(session.getSnapshot().campaign).toBe("unavailable");
  fail = false;
  await session.refreshCampaign();
  expect(session.getSnapshot().campaign).toBe("enabled");
  session.dispose();
  const never = new FeedbackSession(fixture({ loadCampaign: () => new Promise(() => {}) }), 5);
  await never.refreshCampaign();
  expect(never.getSnapshot().campaign).toBe("unavailable");
  never.dispose();
});

test("late and out-of-order config reads cannot re-enable a disabled campaign", async () => {
  const old = deferred<"enabled">();
  let read = 0;
  const session = new FeedbackSession(fixture({ loadCampaign: async () => ++read === 1 ? old.promise : "disabled" }));
  const first = session.refreshCampaign();
  await session.refreshCampaign();
  old.resolve("enabled");
  await first;
  expect(session.getSnapshot().campaign).toBe("disabled");
  session.dispose();
});

test("late rejected config reads are ignored after a fresh result", async () => {
  const old = deferred<"enabled">();
  let read = 0;
  const session = new FeedbackSession(fixture({ loadCampaign: async () => ++read === 1 ? old.promise : "enabled" }));
  const first = session.refreshCampaign();
  await session.refreshCampaign();
  old.reject(new Error("old"));
  await first;
  expect(session.getSnapshot().campaign).toBe("enabled");
  session.dispose();
});

test("already-resolved config promises still respect a newer read or disposal before publication", async () => {
  let reads = 0;
  const session = new FeedbackSession(fixture({ loadCampaign: async () => ++reads === 1 ? "enabled" : "disabled" }));
  const first = session.refreshCampaign();
  const second = session.refreshCampaign();
  await Promise.all([first, second]);
  expect(session.getSnapshot().campaign).toBe("disabled");
  session.dispose();
  const disposed = new FeedbackSession(fixture());
  await disposed.refreshCampaign();
  const pending = disposed.submit(draft);
  disposed.dispose();
  await pending;
  expect(disposed.getSnapshot().submission).toBe("checking");
});

test("disabled/malformed/error/timeout on pre-submit recheck sends no draft", async () => {
  for (const mode of ["disabled", "malformed", "error", "timeout"]) {
    let reads = 0, posts = 0;
    const session = new FeedbackSession(fixture({
      loadCampaign: async () => {
        if (++reads === 1) return "enabled";
        if (mode === "error") throw new Error("config failed");
        if (mode === "timeout") return new Promise(() => {});
        return (mode === "disabled" ? "disabled" : null) as "disabled";
      },
      submit: async () => { posts++; return "submitted"; },
    }), 5);
    await session.refreshCampaign();
    session.open();
    await session.submit(draft);
    expect(posts).toBe(0);
    expect(session.getSnapshot().submission).toBe("idle");
    expect(session.getSnapshot().campaign).toBe(mode === "disabled" ? "disabled" : "unavailable");
    session.dispose();
  }
});

test("double click and Enter are single-flight; close/reopen preserves pending; intentional new send works", async () => {
  const result = deferred<"submitted">();
  const seen: Draft[] = [];
  const session = new FeedbackSession(fixture({ submit: async value => { seen.push(value); return seen.length === 1 ? result.promise : "submitted"; } }));
  await session.refreshCampaign();
  session.open();
  const pending = session.submit(draft);
  expect(session.getSnapshot().submission).toBe("checking");
  await session.submit(draft);
  await expect.poll(() => session.getSnapshot().submission).toBe("sending");
  session.close();
  session.open();
  session.newSubmission();
  expect(session.getSnapshot().submission).toBe("sending");
  await session.submit(draft);
  result.resolve("submitted");
  await pending;
  expect(session.getSnapshot().submission).toBe("submitted");
  expect(seen).toEqual([draft]);
  await session.submit(draft);
  expect(seen).toEqual([draft]);
  session.newSubmission();
  const next = { syntheticText: "lượt mới" };
  await session.submit(next);
  expect(seen).toEqual([draft, next]);
  session.dispose();
});

test("timeout keeps the outcome uncertain; old response cannot change a later operation", async () => {
  const old = deferred<"submitted">();
  const fresh = deferred<"submitted">();
  let calls = 0;
  const session = new FeedbackSession(fixture({ submit: () => ++calls === 1 ? old.promise : fresh.promise }), 500);
  await session.refreshCampaign();
  await session.submit(draft);
  expect(session.getSnapshot().submission).toBe("uncertain");
  expect(calls).toBe(1);
  session.newSubmission();
  const next = session.submit({ syntheticText: "fresh" });
  await expect.poll(() => session.getSnapshot().submission).toBe("sending");
  old.resolve("submitted");
  await Promise.resolve();
  expect(session.getSnapshot().submission).toBe("sending");
  fresh.resolve("submitted");
  await next;
  expect(session.getSnapshot().submission).toBe("submitted");
  expect(calls).toBe(2);
  session.dispose();
});

test("known rejection differs from unknown failure and invalid success values", async () => {
  for (const mode of ["rejected", "network", "malformed", "missing"]) {
    const session = new FeedbackSession(fixture({ submit: async () => {
      if (mode === "rejected") throw new FeedbackSubmissionError();
      if (mode === "network") throw new Error("<script>raw server content</script>");
      return (mode === "malformed" ? { ok: true } : undefined) as unknown as "submitted";
    } }));
    await session.refreshCampaign();
    await session.submit(draft);
    expect(session.getSnapshot().submission).toBe(mode === "rejected" ? "rejected" : "uncertain");
    session.dispose();
  }
});

test("dispose aborts owned work, prevents updates and unsubscribes observers", async () => {
  const read = deferred<"enabled">();
  let signal!: AbortSignal, notifications = 0;
  const session = new FeedbackSession(fixture({ loadCampaign: async value => { signal = value; return read.promise; } }));
  const unsubscribe = session.subscribe(() => notifications++);
  const pending = session.refreshCampaign();
  expect(notifications).toBe(1);
  unsubscribe();
  session.dispose();
  expect(signal.aborted).toBe(true);
  read.resolve("enabled");
  await pending;
  expect(session.getSnapshot().campaign).toBe("loading");
  session.open();
  expect(notifications).toBe(1);
});

test("dispose during submission ignores a late receipt or failure", async () => {
  for (const reject of [false, true]) {
    const result = deferred<"submitted">();
    let signal!: AbortSignal;
    const session = new FeedbackSession(fixture({ submit: async (_, value) => { signal = value; return result.promise; } }));
    await session.refreshCampaign();
    const pending = session.submit(draft);
    await expect.poll(() => session.getSnapshot().submission).toBe("sending");
    session.dispose();
    expect(signal.aborted).toBe(true);
    if (reject) result.reject(new Error("late")); else result.resolve("submitted");
    await pending;
    expect(session.getSnapshot().submission).toBe("sending");
  }
});

test("background config refresh during a pending operation does not strand the operation", async () => {
  const config = deferred<"enabled">();
  let reads = 0, posts = 0;
  const session = new FeedbackSession(fixture({ loadCampaign: async () => ++reads === 2 ? config.promise : "enabled", submit: async () => { posts++; return "submitted"; } }));
  await session.refreshCampaign();
  const pending = session.submit(draft);
  await session.refreshCampaign();
  config.resolve("enabled");
  await pending;
  expect(session.getSnapshot().submission).toBe("submitted");
  expect(posts).toBe(1);
  session.dispose();
});

test("dispose during pre-submit config resolve/reject sends no operation and publishes no result", async () => {
  for (const reject of [false, true]) {
    const config = deferred<"enabled">();
    let reads = 0, posts = 0;
    const session = new FeedbackSession(fixture({
      loadCampaign: async () => ++reads === 1 ? "enabled" : config.promise,
      submit: async () => { posts++; return "submitted"; },
    }));
    await session.refreshCampaign();
    const pending = session.submit(draft);
    session.dispose();
    if (reject) config.reject(new Error("late config")); else config.resolve("enabled");
    await pending;
    expect(posts).toBe(0);
    expect(session.getSnapshot().submission).toBe("checking");
  }
});

test("dispose settles owned work promptly even if an adapter ignores abort", async () => {
  for (const stage of ["checking", "sending"]) {
    let reads = 0;
    const session = new FeedbackSession(fixture({
      loadCampaign: async () => ++reads === 2 && stage === "checking" ? new Promise(() => {}) : "enabled",
      submit: async () => new Promise(() => {}),
    }), 500);
    await session.refreshCampaign();
    const pending = session.submit(draft);
    if (stage === "sending") await expect.poll(() => session.getSnapshot().submission).toBe("sending");
    session.dispose();
    const settled = await Promise.race([pending.then(() => true), new Promise<boolean>(resolve => setTimeout(() => resolve(false), 30))]);
    expect(settled).toBe(true);
    expect(session.getSnapshot().submission).toBe(stage);
  }
});
