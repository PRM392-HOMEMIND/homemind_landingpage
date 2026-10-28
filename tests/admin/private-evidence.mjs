import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir, userInfo } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

export async function privateEvidence(prefix) {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  if (process.platform === "win32") {
    // Authenticate screenshots may contain customer data. Fail closed if ACL setup fails.
    const account = `${process.env.USERDOMAIN}\\${userInfo().username}`;
    execFileSync(
      "icacls.exe",
      [
        directory,
        "/inheritance:r",
        "/grant:r",
        `${account}:(OI)(CI)F`,
        "*S-1-5-18:(OI)(CI)F",
      ],
      { stdio: "ignore" },
    );
  }
  return {
    directory,
    save: (name, value) =>
      writeFile(join(directory, name), JSON.stringify(value, null, 2), {
        mode: 0o600,
      }),
  };
}
