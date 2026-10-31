export const campaign = {
  campaignId: "homepage-feedback-premium-30d", enabled: true, revision: 1, updatedAt: "2026-10-10T00:00:00.000Z",
  offer: { name: "Premium", planId: "personal", durationDays: 30, durationSeconds: 2592000 },
  fields: { fullName: { required: true, minLength: 1, maxLength: 120 }, phoneNumber: { required: true, minLength: 1, maxLength: 40 }, email: { required: true, minLength: 3, maxLength: 254 }, review: { required: true, minLength: 1, maxLength: 5000 } },
  idempotency: { header: "Idempotency-Key", format: "uuid", required: false },
};
export const validDraft = { fullName: "Nguyễn An", phoneNumber: "0912345678", email: "An.Test+popup@Example.invalid", review: "Tôi muốn quản lý đồ dùng thuận tiện hơn. 👪" };
export const receipt = { status: "ACCEPTED", submissionId: "11111111-1111-4111-8111-111111111111", acceptedAt: "2026-10-10T00:00:00.000Z", message: "Thông báo trung tính của fixture, không phải cấp quà." };
