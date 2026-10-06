import { FeedbackSubmissionError, type FeedbackAdapter } from "./adapter";
import { feedbackFields, fieldLabels, sentenceLabel, limits, validateFeedback, type FeedbackDraft, type FieldErrors } from "./validation";

export type FeedbackOperation = { draft: FeedbackDraft; key: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const utc = (v: unknown) => typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
export function validCampaign(v: unknown): v is { enabled: boolean } {
  if (!object(v) || v.campaignId !== "homepage-feedback-premium-30d" || typeof v.enabled !== "boolean" || !Number.isInteger(v.revision) || Number(v.revision) < 1 || !utc(v.updatedAt)) return false;
  if (!object(v.offer) || v.offer.name !== "Premium" || v.offer.planId !== "personal" || v.offer.durationDays !== 30 || v.offer.durationSeconds !== 2592000 || !object(v.fields) || !object(v.idempotency)) return false;
  for (const field of feedbackFields) {
    const rule = v.fields[field];
    if (!object(rule) || rule.required !== true || rule.minLength !== (field === "email" ? 3 : 1) || rule.maxLength !== limits[field]) return false;
  }
  return v.idempotency.header === "Idempotency-Key" && v.idempotency.format === "uuid" && v.idempotency.required === false;
}
function fieldMessages(details: unknown): FieldErrors {
  const result: FieldErrors = {};
  if (!Array.isArray(details)) return result;
  for (const detail of details) {
    if (!object(detail) || !feedbackFields.includes(detail.field as typeof feedbackFields[number])) continue;
    const field = detail.field as typeof feedbackFields[number];
    const messages: Record<string, string> = { REQUIRED: `Vui lòng nhập ${sentenceLabel(fieldLabels[field])}.`, INVALID_TYPE: "Thông tin phải là văn bản.", TOO_LONG: `Tối đa ${limits[field]} ký tự.`, INVALID_FORMAT: "Thông tin chưa đúng định dạng.", INVALID_CHARACTERS: "Thông tin chứa ký tự không hợp lệ." };
    if (typeof detail.code === "string" && Object.hasOwn(messages, detail.code)) result[field] = messages[detail.code];
  }
  return result;
}
const rejections: Record<number, readonly string[]> = {
  400: ["VALIDATION_ERROR", "INVALID_JSON", "INVALID_IDEMPOTENCY_KEY"],
  403: ["FORBIDDEN", "ORIGIN_NOT_ALLOWED"],
  409: ["FEEDBACK_POPUP_DISABLED", "IDEMPOTENCY_CONFLICT"],
  413: ["PAYLOAD_TOO_LARGE"], 415: ["UNSUPPORTED_MEDIA_TYPE"],
  429: ["RATE_LIMITED"], 503: ["FEEDBACK_POPUP_BUSY", "FEEDBACK_POPUP_UNAVAILABLE"],
};
export function createFeedbackAdapter(origin: string, request: typeof fetch = fetch): FeedbackAdapter<FeedbackOperation> {
  const base = new URL(origin);
  if (base.username || base.password || base.search || base.hash || base.pathname !== "/" || (base.protocol !== "https:" && !(base.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)))) throw new Error("Invalid public API origin");
  const url = `${base.origin}/v1/public/feedback-popup`;
  return {
    async loadCampaign(signal) {
      const response = await request(url, { signal, cache: "no-store", credentials: "omit", redirect: "error" });
      if (response.status !== 200) throw new Error("Configuration unavailable");
      const body: unknown = await response.json();
      if (!validCampaign(body)) throw new Error("Configuration unavailable");
      return body.enabled ? "enabled" : "disabled";
    },
    async submit(operation, signal) {
      const errors = validateFeedback(operation.draft);
      if (Object.keys(errors).length) throw new FeedbackSubmissionError("VALIDATION_ERROR", errors);
      if (!uuid.test(operation.key)) throw new FeedbackSubmissionError("INVALID_IDEMPOTENCY_KEY");
      // Select exactly the four DTO fields; never serialize a caller's extra properties.
      const payload = Object.fromEntries(feedbackFields.map(field => [field, operation.draft[field]]));
      const bodyText = JSON.stringify(payload);
      if (new TextEncoder().encode(bodyText).length > 32768) throw new FeedbackSubmissionError("PAYLOAD_TOO_LARGE");
      const response = await request(`${url}/submissions`, { method: "POST", signal, cache: "no-store", credentials: "omit", redirect: "error", headers: { "Content-Type": "application/json", "Idempotency-Key": operation.key }, body: bodyText });
      const body: unknown = await response.json();
      if (response.status === 202 && object(body) && body.status === "ACCEPTED" && typeof body.submissionId === "string" && uuid.test(body.submissionId) && utc(body.acceptedAt) && typeof body.message === "string") return "submitted";
      if (object(body) && object(body.error) && typeof body.error.code === "string" && rejections[response.status]?.includes(body.error.code)) {
        const delay = response.headers.get("Retry-After");
        const seconds = delay && /^\d+$/.test(delay) ? Number(delay) : response.status === 429 ? 60 : body.error.code === "FEEDBACK_POPUP_BUSY" ? 2 : 0;
        const retryAt = seconds > 0 && Number.isSafeInteger(seconds) ? Date.now() + Math.min(seconds, 86400) * 1000 : 0;
        throw new FeedbackSubmissionError(body.error.code, fieldMessages(body.error.details), retryAt);
      }
      // 5xx, unknown errors, non-JSON or malformed 202 can follow a committed
      // operation. Never claim rejection or reward/account status from them.
      throw new Error("Submission outcome unavailable");
    },
  };
}
