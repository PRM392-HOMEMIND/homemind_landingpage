export const feedbackIntegrationStatus = "RELEASED_API_233e715" as const;

export type CampaignAvailability = "enabled" | "disabled";

/** Phase 2 must map a verified public contract into this presentation boundary. */
export interface FeedbackAdapter<Draft> {
  loadCampaign(signal: AbortSignal): Promise<CampaignAvailability>;
  submit(draft: Draft, signal: AbortSignal): Promise<"submitted">;
}

/** Only a verified adapter may classify a response as definitely rejected. */
export class FeedbackSubmissionError extends Error {
  constructor(public code = "REJECTED", public fields: Partial<Record<string, string>> = {}, public retryAt = 0) {
    super("Submission rejected");
  }
}
