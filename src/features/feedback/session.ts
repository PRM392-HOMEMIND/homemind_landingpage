import { FeedbackSubmissionError, type FeedbackAdapter } from "./adapter";

export type CampaignState = "pending-contract" | "loading" | "enabled" | "disabled" | "unavailable";
export type SubmissionState = "idle" | "checking" | "sending" | "submitted" | "rejected" | "uncertain";
export type FeedbackSnapshot = Readonly<{
  campaign: CampaignState;
  submission: SubmissionState;
  open: boolean;
  visited: boolean;
  error?: FeedbackSubmissionError;
  cooling?: boolean;
}>;

/** Owns an operation across close/reopen. No storage, POST retry, or reward inference. */
export class FeedbackSession<Draft> {
  private snapshot: FeedbackSnapshot;
  private listeners = new Set<() => void>();
  private generation = 0;
  private disposed = false;
  private read?: AbortController;
  private operation?: AbortController;
  private lastDraft?: Draft;
  private cooldown?: ReturnType<typeof setTimeout>;

  constructor(private adapter?: FeedbackAdapter<Draft>, private timeoutMs = 20_000) {
    this.snapshot = { campaign: adapter ? "loading" : "pending-contract", submission: "idle", open: false, visited: false };
  }

  getSnapshot = (): FeedbackSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private update(change: Partial<FeedbackSnapshot>) {
    if (this.disposed) return;
    this.snapshot = { ...this.snapshot, ...change };
    for (const listener of this.listeners) listener();
  }

  private async timed<T>(controller: AbortController, action: () => Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    let interrupt: () => void;
    const interrupted = new Promise<never>((_, reject) => {
      interrupt = () => reject(new Error("Outcome unavailable"));
      controller.signal.addEventListener("abort", interrupt, { once: true });
      timer = setTimeout(() => controller.abort(), this.timeoutMs);
    });
    try {
      return await Promise.race([action(), interrupted]);
    } finally {
      clearTimeout(timer!);
      controller.signal.removeEventListener("abort", interrupt!);
    }
  }

  async refreshCampaign() {
    if (!this.adapter || this.disposed || this.operation) return;
    this.read?.abort();
    const controller = new AbortController();
    this.read = controller;
    const generation = ++this.generation;
    this.update({ campaign: "loading" });
    try {
      const availability = await this.timed(controller, () => this.adapter!.loadCampaign(controller.signal));
      if (generation !== this.generation || this.disposed) return;
      this.update({ campaign: availability === "enabled" || availability === "disabled" ? availability : "unavailable" });
    } catch {
      if (generation === this.generation) this.update({ campaign: "unavailable" });
    }
  }

  open = () => {
    if (this.snapshot.campaign === "enabled" || this.snapshot.visited) this.update({ open: true, visited: true });
  };
  close = () => { this.update({ open: false }); };

  newSubmission = () => {
    if (this.operation || this.disposed) return;
    this.lastDraft = undefined;
    this.update({ submission: "idle", error: this.snapshot.error?.retryAt && Date.now() < this.snapshot.error.retryAt ? this.snapshot.error : undefined });
  };

  retrySubmission = async () => {
    if (this.lastDraft === undefined || !["rejected", "uncertain"].includes(this.snapshot.submission) || this.operation || this.disposed || Date.now() < (this.snapshot.error?.retryAt ?? 0)) return;
    const draft = this.lastDraft;
    await this.submit(draft, true);
  };

  async submit(draft: Draft, retry = false) {
    if (!this.adapter || this.disposed || this.operation || this.snapshot.campaign !== "enabled" || (retry ? !["rejected", "uncertain"].includes(this.snapshot.submission) : this.snapshot.submission !== "idle") || Date.now() < (this.snapshot.error?.retryAt ?? 0)) return;
    const fallback = retry ? this.snapshot.submission : "idle";
    const controller = new AbortController();
    this.operation = controller;
    // Supersede reads started before this operation; stale reads cannot re-enable it.
    this.read?.abort();
    const generation = ++this.generation;
    this.update({ submission: "checking", error: undefined });
    try {
      let availability: unknown;
      try {
        availability = await this.timed(controller, () => this.adapter!.loadCampaign(controller.signal));
      } catch {
        if (!this.disposed) this.update({ campaign: "unavailable", submission: fallback });
        return;
      }
      if (this.disposed || generation !== this.generation) return;
      if (availability !== "enabled") {
        this.update({ campaign: availability === "disabled" ? "disabled" : "unavailable", submission: fallback });
        return;
      }
      this.update({ campaign: "enabled", submission: "sending" });
      this.lastDraft = draft;
      const result = await this.timed(controller, () => this.adapter!.submit(draft, controller.signal));
      if (!this.disposed) this.update({ submission: result === "submitted" ? "submitted" : "uncertain" });
    } catch (error) {
      const rejection = error instanceof FeedbackSubmissionError ? error : undefined;
      this.update({ submission: rejection ? "rejected" : "uncertain", error: rejection, cooling: !!rejection?.retryAt, ...(rejection?.code === "FEEDBACK_POPUP_DISABLED" ? { campaign: "disabled" as const } : {}) });
      if (rejection?.retryAt) {
        clearTimeout(this.cooldown);
        this.cooldown = setTimeout(() => this.update({ cooling: false }), Math.max(0, rejection.retryAt - Date.now()));
      }
    } finally {
      this.operation = undefined;
    }
  }

  dispose() {
    this.disposed = true;
    this.generation++;
    this.read?.abort();
    this.operation?.abort();
    this.listeners.clear();
    clearTimeout(this.cooldown);
  }
}
