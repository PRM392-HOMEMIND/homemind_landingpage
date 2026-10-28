// Only imported by opt-in local integration scripts. Never imported by src/.
import { readFile } from "node:fs/promises";
export async function readCredentials() {
  let document;
  try {
    document = JSON.parse(
      await readFile(
        new URL("../../docs/system-admin-bootstrap.json", import.meta.url),
        "utf8",
      ),
    );
  } catch {
    throw new Error("BLOCKED: private credential file missing or invalid JSON");
  }
  // Inspect nested structure without printing any values or unrelated credentials.
  const candidates = [];
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (typeof value.email === "string" && typeof value.password === "string")
      candidates.push(value);
    for (const child of Object.values(value))
      if (child && typeof child === "object") visit(child);
  }
  visit(document);
  if (candidates.length !== 1)
    throw new Error("BLOCKED: expected one email/password credential pair");
  const { email, password } = candidates[0];
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length < 16 ||
    password.length > 128
  )
    throw new Error(
      "BLOCKED: private credential pair violates admin input contract",
    );
  return { email: email.trim().toLowerCase(), password };
}
if (process.argv.includes("--inspect")) {
  try {
    await readCredentials();
    console.log(
      "Private structure: exactly one valid email/password pair. Values withheld.",
    );
  } catch (error) {
    console.log(error.message);
    process.exitCode = 2;
  }
}
