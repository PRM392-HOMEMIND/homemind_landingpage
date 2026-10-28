import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// The 28/10 legal revision intentionally updates billing/privacy clauses.
// Independently freeze the unchanged campaign terms from published 8a199dd;
// the focused browser suite checks the newly authorized clauses separately.
for (const [route, anchor, hash] of [
  ["terms-of-service", "premium-30-ngay", "2d27f2b6f9cea5068984f1b99b0d10212066d07692d5efc5d14e59bb15ca4a4e"],
  ["privacy-policy", "gop-y-nhan-qua-premium", "60e76fd28580ffa17e83e3ac27e51182841d0de3f4c0b6b13a6f5e3c1e7c5ba0"],
]) test(`legal revision preserves published campaign ${route} terms byte for byte`, () => {
  const source=readFileSync(`src/app/(legal)/${route}/page.tsx`,"utf8").replaceAll("\r\n","\n");
  const start=source.indexOf(`\n  {\n    id: "${anchor}"`); const end=source.indexOf("\n];",start);
  expect(start).toBeGreaterThan(0); expect(end).toBeGreaterThan(start);
  expect(createHash("sha256").update(source.slice(start,end)).digest("hex")).toBe(hash);
});
