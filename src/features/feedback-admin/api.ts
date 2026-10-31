import { requestFeedbackAdmin, type Envelope } from "../../lib/admin-api/client";
import { type Schema, ContractError, validateSchema } from "../../lib/admin-api/schema";
import { buildUrl } from "../../lib/admin-api/validation";

// Sources: released BE 233e715, API report §5 and FE handoff; not the older
// generated 36-operation admin catalogue. Additive fields are tolerated.
const string: Schema = { type: "string" };
const bool: Schema = { type: "boolean" };
const integer: Schema = { type: "integer", minimum: 0 };
const uuid: Schema = { type: "string", format: "uuid" };
const adminId: Schema = { type: "string", pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$" };
const timestamp: Schema = { type: "string", format: "date-time" };
const nullable = (schema: Schema): Schema => ({ ...schema, nullable: true });
const object = (properties: Record<string, Schema>, optional: string[] = []): Schema => ({
  type: "object", properties, required: Object.keys(properties).filter(key => !optional.includes(key)),
});
const fixed = (value: string | number): Schema => ({ enum: [value] });
const plan = { plan: fixed("personal"), planName: fixed("Premium"), durationSeconds: fixed(2592000) };
const baseConfig = {
  campaignId: fixed("homepage-feedback-premium-30d"), enabled: bool,
  revision: { type: "integer", minimum: 1, maximum: 2147483647 } as Schema,
  ...plan, createdAt: timestamp, updatedAt: timestamp, updatedBy: nullable(uuid),
};
export const configSchema = object({ ...baseConfig, lastChange: nullable(object({
  actorId: nullable(uuid), previousEnabled: bool, enabled: bool,
  previousRevision: integer, revision: integer, occurredAt: timestamp,
})) });
export const updateSchema = object({ ...baseConfig, changed: bool });
const lifecycleSchema = object({
  nominationId: uuid, rewardId: nullable(uuid), sourceSubmissionId: uuid, accountId: nullable(uuid),
  accountCreatedAt: nullable(timestamp), linkedAt: nullable(timestamp), awardedAt: nullable(timestamp),
  allotmentConsumed: bool, logicalRewardCount: integer, submissionCount: integer,
  firstSubmittedAt: timestamp, lastSubmittedAt: timestamp, state: string,
  durationBudgetSeconds: fixed(2592000), segmentCount: integer,
  allocatedSeconds: { type: "number", minimum: 0 },
  elapsedSeconds: nullable({ type: "number", minimum: 0 }),
  remainingSeconds: nullable({ type: "number", minimum: 0 }),
  expectedStartsAt: nullable(timestamp), expectedEndsAt: nullable(timestamp),
  actualStartedAt: nullable(timestamp), completedAt: nullable(timestamp),
  featureUsage: object({ status: string, used: nullable({ type: "number", minimum: 0 }) }),
});
const benefitSchema = object({
  state: string, reason: nullable(string), ...plan, userId: nullable(uuid), workspaceId: nullable(uuid),
  anchorAt: nullable(timestamp), boundAt: nullable(timestamp), grantedAt: nullable(timestamp),
  startsAt: nullable(timestamp), endsAt: nullable(timestamp), postponed: bool,
});
const baseItem = {
  id: uuid, campaignId: fixed("homepage-feedback-premium-30d"), submittedAt: timestamp,
  fullName: string, email: string, phoneNumber: string, submitterUserId: nullable(uuid),
  duplicate: bool, benefit: benefitSchema, lifecycle: lifecycleSchema,
};
export const itemSchema = object({ ...baseItem, reviewPreview: string, reviewLength: integer }, ["lifecycle"]);
export const detailSchema = object({ ...baseItem, review: string, reviewLength: integer,
  segments: { type: "array", items: object({
    id: uuid, startsAt: timestamp, endsAt: timestamp, plannedEndsAt: timestamp,
    supersededAt: nullable(timestamp), supersededBy: nullable(string),
  }) },
}, ["lifecycle"]);
export const listSchema = object({ items: { type: "array", items: itemSchema },
  page: object({ limit: { type: "integer", minimum: 1, maximum: 100 }, hasMore: bool, nextCursor: nullable(string) }),
});
export type Config = { campaignId: string; enabled: boolean; revision: number; createdAt: string; updatedAt: string; updatedBy: string | null;
  lastChange: { actorId: string | null; previousEnabled: boolean; enabled: boolean; previousRevision: number; revision: number; occurredAt: string } | null };
export type Lifecycle = {
  nominationId: string; rewardId: string | null; sourceSubmissionId: string; accountId: string | null;
  accountCreatedAt: string | null; linkedAt: string | null; awardedAt: string | null;
  allotmentConsumed: boolean; logicalRewardCount: number; submissionCount: number;
  firstSubmittedAt: string; lastSubmittedAt: string; state: string; durationBudgetSeconds: number;
  segmentCount: number; allocatedSeconds: number; elapsedSeconds: number | null; remainingSeconds: number | null;
  expectedStartsAt: string | null; expectedEndsAt: string | null; actualStartedAt: string | null; completedAt: string | null;
  featureUsage: { status: string; used: number | null };
};
export type Submission = {
  id: string; campaignId: string; submittedAt: string; fullName: string; email: string; phoneNumber: string;
  submitterUserId: string | null; duplicate: boolean; reviewPreview: string; reviewLength: number;
  benefit: { state: string; reason: string | null; userId: string | null; workspaceId: string | null;
    anchorAt: string | null; boundAt: string | null; grantedAt: string | null; startsAt: string | null; endsAt: string | null; postponed: boolean };
  lifecycle?: Lifecycle;
};
export type Detail = Omit<Submission, "reviewPreview"> & { review: string; segments: Array<{
  id: string; startsAt: string; endsAt: string; plannedEndsAt: string; supersededAt: string | null; supersededBy: string | null;
}> };
export type List = { items: Submission[]; page: { limit: number; hasMore: boolean; nextCursor: string | null } };
export const states = ["PENDING_ACCOUNT", "WAITING_ENTITLEMENT", "SCHEDULED", "ACTIVE", "EXPIRED", "CONFLICT", "BLOCKED", "DUPLICATE"] as const;
export const stateLabels: Record<string, string> = {
  PENDING_ACCOUNT: "Chờ tài khoản", WAITING_ENTITLEMENT: "Chờ quyền hiện có kết thúc", SCHEDULED: "Đã lên lịch",
  ACTIVE: "Đang có hiệu lực", EXPIRED: "Đã hết thời gian", CONFLICT: "Xung đột liên kết", BLOCKED: "Bị chặn", DUPLICATE: "Gửi lại",
};
export const stateLabel = (value: string) => Object.hasOwn(stateLabels, value) ? stateLabels[value] : "Trạng thái chưa hỗ trợ";
export type Filters = { limit?: string; cursor?: string; sort?: string; from?: string; to?: string; q?: string; benefitState?: string; userId?: string; duplicate?: string };
export function filterQuery(filters: Filters): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (!["limit", "cursor", "sort", "from", "to", "q", "benefitState", "userId", "duplicate"].includes(key)) throw new ContractError("filter");
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || value.length > 2048) throw new ContractError("filter");
    const text = key === "q" ? value.trim() : value;
    if (key === "limit" && (!/^[1-9]\d{0,2}$/.test(text) || Number(text) > 100)) throw new ContractError("filter.limit");
    if (key === "sort" && !["newest", "oldest"].includes(text)) throw new ContractError("filter.sort");
    if (key === "benefitState" && !(states as readonly string[]).includes(text)) throw new ContractError("filter.benefitState");
    if (key === "duplicate" && !["true", "false"].includes(text)) throw new ContractError("filter.duplicate");
    if (key === "userId") validateSchema(adminId, text, {});
    if (key === "q" && text.length > 120) throw new ContractError("filter.q");
    if (key === "from" || key === "to") {
      if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(text)) throw new ContractError("filter.date");
      validateSchema(timestamp, text, {});
      if (new Date(text).toISOString().slice(0, 19) !== text.slice(0, 19)) throw new ContractError("filter.date");
    }
    if (text) query.set(key, text);
  }
  if (query.has("from") !== query.has("to")) throw new ContractError("filter.window");
  if (query.has("from")) {
    const duration = Date.parse(query.get("to")!) - Date.parse(query.get("from")!);
    if (duration <= 0 || duration > 366 * 86400000) throw new ContractError("filter.window");
  }
  return query;
}
function url(path = "", query?: URLSearchParams) {
  // Use the authenticated client's origin, independently of public-only env overrides.
  const target = new URL(`/v1/admin/feedback-popup${path}`, new URL(buildUrl("adminMe")).origin);
  target.search = query?.toString() || "";
  return target.href;
}
export const readConfig = (signal?: AbortSignal): Promise<Envelope<Config>> => requestFeedbackAdmin(url(), "GET", configSchema, { signal });
export const readList = (filters: Filters, signal?: AbortSignal): Promise<Envelope<List>> => requestFeedbackAdmin(url("/submissions", filterQuery(filters)), "GET", listSchema, { signal });
export function readDetail(id: string, signal?: AbortSignal): Promise<Envelope<Detail>> {
  validateSchema(adminId, id, {});
  return requestFeedbackAdmin(url(`/submissions/${id}`), "GET", detailSchema, { signal });
}
export function updateConfig(enabled: boolean, revision: number, csrf: string, signal?: AbortSignal): Promise<Envelope<Omit<Config, "lastChange"> & { changed: boolean }>> {
  validateSchema(object({ enabled: bool, expectedRevision: baseConfig.revision }), { enabled, expectedRevision: revision }, {});
  return requestFeedbackAdmin(url(), "PATCH", updateSchema, { body: { enabled, expectedRevision: revision }, csrf, signal });
}

export function pageCounts(items: Submission[]) {
  return { submissions: items.length, repeats: items.filter(item => item.duplicate).length,
    issuedRewards: new Set(items.map(item => item.lifecycle?.rewardId).filter(Boolean)).size };
}
