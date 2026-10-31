// Explicit test fixtures, never imported by production code.
export const adminId = "550e8400-e29b-41d4-a716-446655440000";
export const adminTime = "2026-10-10T01:00:00.000Z";
export const adminConfig = { campaignId: "homepage-feedback-premium-30d", enabled: false, revision: 1,
  plan: "personal", planName: "Premium", durationSeconds: 2592000, createdAt: adminTime, updatedAt: adminTime, updatedBy: null, lastChange: null };
export const adminItem = {
  id: adminId, campaignId: adminConfig.campaignId, submittedAt: adminTime, fullName: "Nguyễn <b>Fixture</b>",
  email: "synthetic@example.test", phoneNumber: "+84912345678", submitterUserId: null, duplicate: false,
  reviewPreview: "Góp ý <script>window.leak=1</script>", reviewLength: 36,
  benefit: { state: "PENDING_ACCOUNT", reason: null, plan: "personal", planName: "Premium", durationSeconds: 2592000,
    userId: null, workspaceId: null, anchorAt: adminTime, boundAt: null, grantedAt: null, startsAt: null, endsAt: null, postponed: false },
  lifecycle: { nominationId: adminId, rewardId: null, sourceSubmissionId: adminId, accountId: null, accountCreatedAt: null,
    linkedAt: null, awardedAt: null, allotmentConsumed: false, logicalRewardCount: 0, submissionCount: 1,
    firstSubmittedAt: adminTime, lastSubmittedAt: adminTime, state: "PENDING_ACCOUNT", durationBudgetSeconds: 2592000,
    segmentCount: 0, allocatedSeconds: 0, elapsedSeconds: null, remainingSeconds: null, expectedStartsAt: null,
    expectedEndsAt: null, actualStartedAt: null, completedAt: null, featureUsage: { status: "NOT_TRACKED", used: null } },
};
export const adminDetail = { ...adminItem, review: adminItem.reviewPreview, segments: [] };
export const adminList = { items: [adminItem], page: { limit: 25, hasMore: false, nextCursor: null } };
export const adminEnvelope = (data: unknown) => ({ data, meta: { requestId: adminId, asOf: adminTime, version: "admin-v1", freshness: "repeatable_read" } });
export const adminError = (code: string) => ({ error: { code, message: "<script>sensitive server message</script>", requestId: adminId, fields: [] } });
