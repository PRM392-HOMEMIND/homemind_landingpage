// Safe source/staging/build/package review. Never prints matched secret values.
import { readFile, readdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, relative } from "node:path";
import { readCredentials } from "./private-credentials.mjs";

const forbidden =
  /(?:^|\/)(?:system-admin-bootstrap\.json|admin-storage-state[^/]*\.json|admin-session[^/]*\.json|\.admin-private)(?:\/|$)/i;
const normalize = (value) => value.replaceAll("\\", "/");
const findings = [];
let credentials;
try {
  credentials = await readCredentials();
} catch {
  /* CI deliberately receives no production credential. */
}
const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
// The supplied login identifier may be the existing public support address.
// Verify that fact against committed public configuration, without printing it.
// Preserve public content; continue rejecting the password everywhere and the
// login identifier in new admin code. This is reported separately, never hidden.
let existingPublicIdentifier = false;
if (credentials)
  try {
    existingPublicIdentifier = Buffer.from(
      git("show", "HEAD:src/config/site.ts"),
    ).includes(Buffer.from(credentials.email));
  } catch {}
const source = git(
  "ls-files",
  "--cached",
  "--others",
  "--exclude-standard",
  "-z",
)
  .split("\0")
  .filter(Boolean);
const staged = git(
  "diff",
  "--cached",
  "--name-only",
  "--diff-filter=ACMR",
  "-z",
)
  .split("\0")
  .filter(Boolean);
let inspected = 0;
function scan(name, buffer, artifact = false) {
  inspected++;
  if (forbidden.test(normalize(name)))
    findings.push(`${name}: forbidden private artifact`);
  if (credentials && buffer.includes(Buffer.from(credentials.password)))
    findings.push(`${name}: supplied password detected (withheld)`);
  if (
    credentials &&
    buffer.includes(Buffer.from(credentials.email)) &&
    (!existingPublicIdentifier ||
      /(?:src\/(?:features|layouts|lib\/auth|lib\/admin-api|components\/admin)|tests\/admin)/.test(
        normalize(name),
      ))
  )
    findings.push(`${name}: private login identifier introduced (withheld)`);
  if (artifact && buffer.includes(Buffer.from("system-admin-bootstrap.json")))
    findings.push(`${name}: private credential path in build`);
}
for (const name of source) {
  if (name === ".admin-lint.json") continue;
  try {
    scan(name, await readFile(name));
  } catch {
    findings.push(`${name}: unreadable source`);
  }
}
for (const name of staged)
  scan(`index:${name}`, Buffer.from(git("show", `:${name}`)));
async function walk(directory, artifact = false) {
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await walk(path, artifact);
      else if (entry.isFile()) {
        const info = await stat(path);
        if (info.size < 32 * 1024 * 1024)
          scan(
            normalize(relative(process.cwd(), path)),
            await readFile(path),
            artifact,
          );
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
await walk("public", true);
await walk(".next/static", true);
await walk(".next/server", true);
await walk(".next/standalone", true);
const docker = await readFile("Dockerfile", "utf8");
const ignore = await readFile(".dockerignore", "utf8");
if (
  !ignore.split(/\r?\n/).includes("docs") ||
  !ignore.includes("**/system-admin-bootstrap.json") ||
  /^COPY\s+\.\s/m.test(docker)
)
  findings.push("Docker context/private allowlist invalid");
try {
  git("check-ignore", "--quiet", "docs/system-admin-bootstrap.json");
} catch {
  findings.push("Bootstrap file is not ignored");
}
if (git("ls-files", "docs/system-admin-bootstrap.json").trim())
  findings.push("Bootstrap file is tracked");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
// On Windows invoke npm's Node entry point directly, avoiding cmd string escaping.
const command = process.platform === "win32" ? process.execPath : npm;
const args =
  process.platform === "win32"
    ? [
        join(
          process.execPath,
          "..",
          "node_modules",
          "npm",
          "bin",
          "npm-cli.js",
        ),
        "pack",
        "--dry-run",
        "--json",
        "--ignore-scripts",
      ]
    : ["pack", "--dry-run", "--json", "--ignore-scripts"];
const packages = JSON.parse(
  execFileSync(command, args, {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  }),
);
for (const file of packages[0].files)
  if (
    forbidden.test(file.path) ||
    file.path.startsWith("docs/") ||
    file.path.startsWith("tests/")
  )
    findings.push(`package:${file.path}: private/test documentation packaged`);
const imageAt = process.argv.indexOf("--image");
if (imageAt !== -1) {
  const image = process.argv[imageAt + 1];
  if (!image || !/^[a-zA-Z0-9/:._@-]+$/.test(image))
    throw new Error("Invalid image name");
  const container = execFileSync(
    "docker",
    ["create", "--network", "none", image],
    { encoding: "utf8" },
  ).trim();
  try {
    scan(
      "container-runtime-tar",
      execFileSync("docker", ["export", container], {
        maxBuffer: 512 * 1024 * 1024,
      }),
      true,
    );
  } finally {
    execFileSync("docker", ["rm", container], { stdio: "ignore" });
  }
}
console.log(
  JSON.stringify({
    check: "secret-boundaries",
    sourceFiles: source.length,
    stagedFiles: staged.length,
    filesInspected: inspected,
    knownCredentialComparison: credentials
      ? "private-local"
      : "NOT_RUN_CI_HAS_NO_CREDENTIAL",
    loginIdentifierAlreadyPublicInBaseline: existingPublicIdentifier,
    findings: findings.length,
  }),
);
for (const finding of findings) console.log(finding);
if (findings.length) process.exitCode = 1;
