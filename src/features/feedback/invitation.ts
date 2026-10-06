import type { FeedbackSession } from "./session";

type InvitationSession = Pick<FeedbackSession<never>, "getSnapshot" | "subscribe" | "refreshCampaign" | "open">;

export const REOPEN_DELAY_MS = 120_000;

export interface InvitationEnvironment {
  now(): number;
  safeToOpen(): boolean;
  prepareInitialOpen(): void;
  schedule(action: () => void, delay: number): ReturnType<typeof setTimeout>;
  cancel(timer: ReturnType<typeof setTimeout>): void;
}

/** Only owns invitations. Drafts, results, HTTP operation identity and POSTs stay in the session. */
export class FeedbackInvitations {
  private deadline: number | undefined;
  private timer?: ReturnType<typeof setTimeout>;
  private unsubscribe?: () => void;
  private checking = false;
  private stopped = false;
  private generation = 0;
  private wasOpen: boolean;
  private firstInvitation: boolean;

  constructor(private session: InvitationSession, private environment: InvitationEnvironment) {
    this.wasOpen = session.getSnapshot().open;
    this.firstInvitation = !this.wasOpen;
  }

  start() {
    if (this.unsubscribe || this.stopped) return;
    this.wasOpen = this.session.getSnapshot().open;
    this.unsubscribe = this.session.subscribe(() => {
      const open = this.session.getSnapshot().open;
      if (open === this.wasOpen) return;
      this.wasOpen = open;
      if (open) this.firstInvitation = false;
      this.generation++;
      this.clearTimer();
      this.deadline = open ? undefined : this.environment.now() + REOPEN_DELAY_MS;
      if (!open) this.wake();
    });
    // Refresh still supplies the manual CTA when the tab initially loads hidden.
    if (!this.wasOpen) { this.deadline = this.environment.now(); void this.check(true); }
  }

  private clearTimer() {
    if (this.timer !== undefined) this.environment.cancel(this.timer);
    this.timer = undefined;
  }

  wake = () => {
    this.clearTimer();
    if (this.stopped || this.checking || this.deadline === undefined || this.session.getSnapshot().open) return;
    const remaining = this.deadline - this.environment.now();
    if (remaining > 0) {
      this.timer = this.environment.schedule(this.wake, remaining);
    } else if (this.environment.safeToOpen()) {
      void this.check();
    }
    // A due invitation waits for visibility/focus or the other dialog to close.
    // No polling and no focus in a background tab.
  };

  private async check(initial = false) {
    if (this.stopped || this.checking || (!initial && !this.environment.safeToOpen())) return;
    this.checking = true;
    const generation = this.generation;
    try {
      await this.session.refreshCampaign();
      if (this.stopped || generation !== this.generation || this.session.getSnapshot().open) return;
      if (this.session.getSnapshot().campaign !== "enabled") {
        // Bounded GET recovery, never a POST retry or an enabled cache.
        this.deadline = this.environment.now() + REOPEN_DELAY_MS;
      } else if (this.environment.safeToOpen()) {
        if (this.firstInvitation) this.environment.prepareInitialOpen();
        this.session.open();
      }
    } finally {
      this.checking = false;
      // A deferred successful check waits for an external wake, avoiding a GET loop.
      if (!this.stopped && this.deadline !== undefined && this.deadline > this.environment.now()) this.wake();
    }
  }

  stop() {
    this.stopped = true;
    this.generation++;
    this.clearTimer();
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }
}

const owners = new WeakMap<Document, FeedbackInvitations>();

/** One owner per page, even if another instance mounts during StrictMode/Fast Refresh. */
export function startFeedbackInvitations(session: InvitationSession, document: Document, window: Window) {
  if (owners.has(document)) return () => {};
  const invitations = new FeedbackInvitations(session, {
    now: () => Date.now(),
    schedule: (action, delay) => setTimeout(action, delay),
    cancel: timer => clearTimeout(timer),
    prepareInitialOpen: () => {
      // Next's pending fragment scroll cannot run while the dialog fixes the
      // body. Resolve this initial navigation before acquiring the scroll lock.
      // Later invitations preserve the visitor's current scroll position.
      const hash = window.location.hash;
      if (!hash) return;
      let id: string;
      try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
      document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    },
    safeToOpen: () => window.location.pathname === "/" && document.visibilityState === "visible" && document.hasFocus() &&
      !Array.from(document.querySelectorAll<HTMLElement>('dialog[open], [role="dialog"][aria-modal="true"], [role="alertdialog"][aria-modal="true"]'))
        .some(element => !element.hasAttribute("data-feedback-dialog") && element.getAttribute("aria-hidden") !== "true" && element.getClientRects().length > 0),
  });
  owners.set(document, invitations);
  const observer = new MutationObserver(invitations.wake);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "hidden", "aria-hidden", "aria-modal"] });
  document.addEventListener("visibilitychange", invitations.wake);
  window.addEventListener("focus", invitations.wake);
  window.addEventListener("online", invitations.wake);
  invitations.start();
  return () => {
    invitations.stop();
    observer.disconnect();
    document.removeEventListener("visibilitychange", invitations.wake);
    window.removeEventListener("focus", invitations.wake);
    window.removeEventListener("online", invitations.wake);
    owners.delete(document);
  };
}
