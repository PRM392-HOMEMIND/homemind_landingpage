// Coverage tooling regression, not an application fixture or production route.
// Run from repo root with FEEDBACK_COVERAGE_TOOLS and a task-owned output path.
import { createServer } from "node:http";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import assert from "node:assert/strict";

if (!process.argv[2]) throw new Error("Provide a task-owned coverage regression directory");
const fixture = resolve(process.argv[2]);
if (process.platform === "win32" && !["feedback-popup-fe", "feedback-popup-fe-redesign", "feedback-popup-fe-alignment"].some(task => fixture.toLowerCase().startsWith(`h:\\homemind\\tasks\\${task}\\`))) throw new Error("Task-owned H: output required");
mkdirSync(fixture, { recursive: true });
writeFileSync(join(fixture, "unit.json"), "{}");
const map = {
  version: 3,
  sections: [
    { offset: { line: 0, column: 0 }, map: { version: 3, sources: ["src/features/feedback/__coverage_fixture_a.ts"], sourcesContent: ["function a(){return 1;}\na();\n"], names: [], mappings: "AAAA;AACA" } },
    { offset: { line: 2, column: 0 }, map: { version: 3, sources: ["src/features/feedback/__coverage_fixture_b.ts"], sourcesContent: ["function b(){return 2;}\nb();\n"], names: [], mappings: "AAAA;AACA" } },
  ],
};
const server = createServer((request, response) => {
  if (request.url !== "/fixture.js.map") { response.statusCode = 404; response.end(); return; }
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(map));
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
try {
  const source = 'function a(){const example="//# sourceMappingURL=missing.map";return 1;}\na();\nfunction b(){return 2;}\nb();\n//# sourceMappingURL=missing.map\n//# sourceMappingURL=fixture.js.map';
  const port = server.address().port;
  writeFileSync(join(fixture, "browser-coverage.json"), JSON.stringify([{ url: `http://127.0.0.1:${port}/fixture.js`, source, functions: [{ functionName: "", ranges: [{ startOffset: 0, endOffset: source.length, count: 1 }], isBlockCoverage: true }] }]));
  await promisify(execFile)(process.execPath, ["tests/feedback/report-browser-coverage.mjs", fixture, join(fixture, "unit.json"), join(fixture, "result")], { cwd: process.cwd(), env: process.env });
  const summary = JSON.parse(readFileSync(join(fixture, "result/summary.json"), "utf8"));
  assert.equal(summary.files.length, 2);
  for (const name of ["a", "b"]) {
    const row = summary.files.find(row => row.path.endsWith(`__coverage_fixture_${name}.ts`));
    assert.ok(row);
    assert.equal(row.lines.pct, 100);
    assert.ok(row.lines.total >= 2);
  }
  console.log("PASS: indexed source-map sections retain both source paths and line ranges. Synthetic helper output must NEVER be merged into application coverage.");
} finally {
  await new Promise(resolve => server.close(resolve));
}
