// Run with task-local c8 dependencies and source maps from the H: preview build.
// This never changes productionBrowserSourceMaps in the frontend repository.
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const [browserResults, unitReport, output] = process.argv.slice(2);
if (!browserResults || !unitReport || !output || !process.env.FEEDBACK_COVERAGE_TOOLS) throw new Error("Provide results, unit report, H: output and FEEDBACK_COVERAGE_TOOLS");
if (process.platform === "win32" && !["feedback-popup-fe", "feedback-popup-fe-redesign", "feedback-popup-fe-alignment"].some(task => resolve(output).toLowerCase().startsWith(`h:\\homemind\\tasks\\${task}\\`))) throw new Error("Coverage output must be in task-owned H: storage");
const require = createRequire(join(resolve(process.env.FEEDBACK_COVERAGE_TOOLS), "package.json"));
const convert = require("v8-to-istanbul");
const { FlattenMap, encodedMap } = require("@jridgewell/trace-mapping");
const { createCoverageMap } = require("istanbul-lib-coverage");
const { createContext } = require("istanbul-lib-report");
const reports = require("istanbul-reports");
const map = createCoverageMap(JSON.parse(readFileSync(unitReport, "utf8")));
const evidence = { entries: 0, mapped: 0, files: [], unavailable: [] };
const cachedMaps = new Map();
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : entry.name === "browser-coverage.json" ? [join(dir, entry.name)] : []);
}
for (const file of files(browserResults)) {
  for (const entry of JSON.parse(readFileSync(file, "utf8"))) {
    evidence.entries++;
    // Only an actual comment directive counts; bundled code may contain this
    // text in strings or an earlier dependency map. The last directive wins.
    const reference = entry.source ? [...entry.source.matchAll(/^[ \t]*\/\/[#@]\s*sourceMappingURL=(\S+)[ \t]*$/gm)].at(-1)?.[1] : undefined;
    if (!reference) { evidence.unavailable.push({ file, url: entry.url, reason: "No source map" }); continue; }
    const mapUrl = new URL(reference, entry.url);
    if (mapUrl.hostname === "homemind.vn" && process.env.FEEDBACK_COVERAGE_LOCAL_ORIGIN) {
      const local = new URL(process.env.FEEDBACK_COVERAGE_LOCAL_ORIGIN);
      if (local.hostname !== "127.0.0.1") throw new Error("Owned preview required");
      mapUrl.protocol = local.protocol; mapUrl.host = local.host;
    }
    if (mapUrl.hostname !== "127.0.0.1") throw new Error("Coverage must use the owned local preview, not a remote server");
    if (!cachedMaps.has(mapUrl.href)) {
      const response = await fetch(mapUrl);
      if (!response.ok) throw new Error(`Local source map HTTP ${response.status}`);
      let original = await response.json();
      // Next dev emits indexed maps. Preserve section offsets using the
      // converter's existing trace-mapping dependency before resolving paths.
      if (Array.isArray(original.sections)) original = encodedMap(FlattenMap(original));
      if (!Array.isArray(original.sources)) throw new Error("Unverified source map format");
      cachedMaps.set(mapUrl.href, original);
    }
    const original = cachedMaps.get(mapUrl.href);
    const sources = original.sources.map(source => {
      const normalized = source.replaceAll("\\", "/");
      const index = normalized.indexOf("src/");
      return index < 0 ? source : resolve(process.env.FEEDBACK_COVERAGE_SOURCE_ROOT || ".", normalized.slice(index).split("?")[0]);
    });
    const converter = convert(resolve("coverage-chunk.js"), 0, { source: entry.source, sourceMap: { sourcemap: { ...original, sourceRoot: "", sources } } });
    await converter.load();
    converter.applyCoverage(entry.functions);
    for (const [path, data] of Object.entries(converter.toIstanbul())) {
      if (!/\/src\/(?:features\/feedback(?:-admin)?\/|lib\/admin-api\/client\.ts|lib\/auth\/admin-session\.ts|config\/public-api\.ts)/.test(path.replaceAll("\\", "/"))) continue;
      map.merge({ [path]: data });
      evidence.files.push(path);
    }
    evidence.mapped++;
  }
}
mkdirSync(output, { recursive: true });
writeFileSync(join(output, "mapping-evidence.json"), JSON.stringify({ ...evidence, files: [...new Set(evidence.files)] }, null, 2));
writeFileSync(join(output, "coverage-final.json"), JSON.stringify(map.toJSON()));
writeFileSync(join(output, "summary.json"), JSON.stringify({ total: map.getCoverageSummary().toJSON(), files: map.files().map(path => ({ path, ...map.fileCoverageFor(path).toSummary().toJSON() })) }, null, 2));
const context = createContext({ dir: output, coverageMap: map });
reports.create("html").execute(context);
reports.create("text").execute(context);
