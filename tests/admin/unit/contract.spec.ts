import { test, expect } from "@playwright/test";
import {
  buildUrl,
  dateBoundary,
  normalizeLogin,
  validateUtc,
} from "../../../src/lib/admin-api/validation";
import {
  operations,
  schemas,
  type OperationId,
} from "../../../src/lib/admin-api/contract";
import { validateSchema } from "../../../src/lib/admin-api/schema";
import {
  money,
  moneyCoordinate,
  date,
} from "../../../src/lib/formatting/admin";
// Pure unit inputs only. These never enter runtime or serve as live evidence.
const id = "12345678-1234-4123-8123-123456789abc";
test("36 declared operations keep a single admin prefix and reject every unknown query", () => {
  expect(Object.keys(operations)).toHaveLength(36);
  for (const key of Object.keys(operations) as OperationId[]) {
    const params = Object.fromEntries(
      operations[key].params.map((p) => [p, id]),
    );
    const required = key === "adminCurrentUsage" ? { workspaceId: id } : {};
    expect(buildUrl(key, params, required)).toMatch(
      /^https:\/\/api\.homemind\.vn\/v1\/admin\/(?!v1\/admin)/,
    );
    expect(() =>
      buildUrl(key, params, { ...required, unknown: "true" }),
    ).toThrow();
  }
});
test("endpoint-specific filters and path/query consistency are enforced", () => {
  for (const key of ["adminPlanDistribution", "adminOperations"] as const)
    expect(() => buildUrl(key, {}, { provenance: "REAL" })).toThrow();
  expect(() =>
    buildUrl("adminPaymentTransactions", { paymentId: id }, { sort: "newest" }),
  ).toThrow();
  expect(() => buildUrl("adminPayments", {}, { q: "query" })).toThrow();
  expect(() => buildUrl("adminCurrentUsage", {}, {})).toThrow();
  expect(() =>
    buildUrl(
      "adminUserActivity",
      { userId: id },
      { userId: "22345678-1234-4123-8123-123456789abc" },
    ),
  ).toThrow();
  expect(() =>
    buildUrl("adminUser", { userId: id.replace("-4123", "-1123") }),
  ).toThrow();
});
test("strict input validation preserves booleans, integer ranges and UTC windows", () => {
  for (const limit of ["0", "101", "1.1", "-1", "01", "1e2"])
    expect(() => buildUrl("adminUsers", {}, { limit })).toThrow();
  for (const value of ["TRUE", "1", "yes"])
    expect(() => buildUrl("adminUsers", {}, { paying: value })).toThrow();
  expect(() => buildUrl("adminUsers", {}, { q: "x".repeat(121) })).toThrow();
  expect(() => validateUtc("2026-02-30T00:00:00Z")).toThrow();
  expect(() => validateUtc("2026-10-07T00:00:00+00:00")).toThrow();
  expect(() =>
    buildUrl("adminOverview", {}, { from: "2026-01-01T00:00:00Z" }),
  ).toThrow();
  expect(() =>
    buildUrl(
      "adminOverview",
      {},
      { from: "2026-01-01T00:00:00Z", to: "2026-01-01T00:00:00Z" },
    ),
  ).toThrow();
  expect(() =>
    buildUrl(
      "adminOverview",
      {},
      { from: "2026-01-01T00:00:00Z", to: "2028-01-01T00:00:00Z" },
    ),
  ).toThrow();
  expect(
    buildUrl("adminUsers", {}, { q: undefined, status: "", limit: "25" }),
  ).not.toContain("undefined");
});
test("password is preserved exactly while email is normalized", () => {
  const password = "  isolated-unit-value-with-spaces  ";
  expect(normalizeLogin(" ADMIN@EXAMPLE.INVALID ", password)).toEqual({
    email: "admin@example.invalid",
    password,
  });
  expect(() => normalizeLogin("bad", "short")).toThrow();
});
test("RFC3339 offsets and microseconds match OpenAPI; calendar errors do not", () => {
  const schema = { type: "string", format: "date-time" };
  for (const value of [
    "2026-10-07T00:00:00Z",
    "2026-10-07T00:00:00.123456+00:00",
    "2026-10-07T07:00:00+07:00",
  ])
    expect(() => validateSchema(schema, value, schemas)).not.toThrow();
  for (const value of ["2026-02-30T00:00:00Z", "not-a-date", "2026-10-07"])
    expect(() => validateSchema(schema, value, schemas)).toThrow();
  expect(() =>
    validateSchema({ type: "string", format: "date" }, "2026-99-99", schemas),
  ).toThrow("Dữ liệu máy chủ chưa tương thích");
});
test("nullability, required properties and additive fields are distinct", () => {
  expect(() =>
    validateSchema(
      schemas.Page,
      { limit: 25, hasMore: false, nextCursor: null, additive: "allowed" },
      schemas,
    ),
  ).not.toThrow();
  expect(() =>
    validateSchema(schemas.Page, { limit: 25, hasMore: false }, schemas),
  ).toThrow();
  expect(() =>
    validateSchema(
      schemas.Page,
      { limit: "25", hasMore: false, nextCursor: null },
      schemas,
    ),
  ).toThrow();
  expect(() =>
    validateSchema(schemas.Money, { currency: "VND", amount: null }, schemas),
  ).toThrow();
  expect(() =>
    validateSchema(schemas.Money, { currency: "VND", amount: "1.1" }, schemas),
  ).toThrow();
  expect(() =>
    validateSchema(schemas.Spending.properties!.refunds, 0, schemas),
  ).toThrow();
});
test("VND precision and chart scaling survive amounts above Number.MAX_SAFE_INTEGER", () => {
  const amount = "900719925474099312345";
  expect(money({ currency: "VND", amount })).toBe(
    `${BigInt(amount).toLocaleString("vi-VN")} ₫`,
  );
  expect(
    moneyCoordinate("100000000000000000000", "200000000000000000000"),
  ).toBe(0.5);
  expect(moneyCoordinate("0", "0")).toBe(0);
});
test("date-only expiry and explicit timezone boundaries cannot drift", () => {
  expect(date("2026-10-07")).toBe("07/10/2026");
  expect(dateBoundary("2026-10-07", "Asia/Ho_Chi_Minh")).toBe(
    "2026-10-06T17:00:00.000Z",
  );
  expect(dateBoundary("2026-10-07", "UTC")).toBe("2026-10-07T00:00:00.000Z");
  expect(() => dateBoundary("2026-02-30", "UTC")).toThrow();
});
