import { test, expect } from "@playwright/test";
import { validateFeedback, feedbackFields } from "../../src/features/feedback/validation";
import { validDraft } from "./contract-fixtures";

for (const field of feedbackFields) {
  for (const value of [undefined, null, "", " \t \n ", 1, false, [], {}]) {
    test(`${field} rejects required/type ${JSON.stringify(value)}`, () => expect(validateFeedback({ ...validDraft, [field]: value })[field]).toBeTruthy());
  }
  for (const value of ["\u0000", "\u007f", "\ud800", "\udc00"]) {
    test(`${field} rejects unsafe code point ${JSON.stringify(value)}`, () => expect(validateFeedback({ ...validDraft, [field]: value })[field]).toBeTruthy());
  }
}
for (const [field, max] of [["fullName", 120], ["review", 5000]] as const) {
  for (const count of [0, 1, max - 1, max, max + 1]) test(`${field} code point boundary ${count}`, () => {
    const value = "👪".repeat(count);
    expect(!!validateFeedback({ ...validDraft, [field]: value })[field]).toBe(count === 0 || count > max);
  });
  test(`${field} NFC decomposed text and whitespace`, () => expect(validateFeedback({ ...validDraft, [field]: ` ${"e\u0301".repeat(max)} ` })[field]).toBeUndefined());
}
for (const [field, cap] of [["fullName", 1000], ["review", 20000], ["email", 1000], ["phoneNumber", 200]] as const) {
  for (const count of [cap - 1, cap, cap + 1]) test(`${field} raw cap ${count}`, () => {
    const inner = validDraft[field];
    const value = inner + " ".repeat(count - inner.length);
    expect(!!validateFeedback({ ...validDraft, [field]: value })[field]).toBe(count > cap);
  });
}
for (const email of ["a+b.c@example.invalid", " An.Test+popup@EXAMPLE.invalid ", "é@example.invalid", "e\u0301@example.invalid", `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(61)}`, `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(60)}`]) {
  test(`valid auth email ${email.length} ${email.slice(0,12)}`, () => expect(validateFeedback({ ...validDraft, email }).email).toBeUndefined());
}
for (const email of ["a", "a@", "a b@example.invalid", "a..b@example.invalid", "a@localhost", `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(62)}`]) test(`invalid auth email ${email.length}`, () => expect(validateFeedback({ ...validDraft, email }).email).toBeTruthy());
for (const phoneNumber of ["0912345678", "+84 912 345 678", "84912345678", "+1 202 555 0123"]) test(`valid phone ${phoneNumber}`, () => expect(validateFeedback({ ...validDraft, phoneNumber }).phoneNumber).toBeUndefined());
for (const length of [0, 1, 39, 40, 41]) test(`phone length boundary ${length}`, () => expect(validateFeedback({ ...validDraft, phoneNumber: "x".repeat(length) }).phoneNumber).toBeTruthy());
test("review permits tab CR LF and plain HTML; text/name and empty body checks", () => {
  expect(validateFeedback({ ...validDraft, review: "a\t\r\n<script>alert(1)</script>" })).toEqual({});
  expect(validateFeedback({ ...validDraft, fullName: "a\nb" }).fullName).toBeTruthy();
  expect(Object.keys(validateFeedback(null))).toHaveLength(4);
  expect(Object.keys(validateFeedback([]))).toHaveLength(4);
  expect(validateFeedback(validDraft)).toEqual({});
});
