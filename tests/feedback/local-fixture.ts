import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

// No DSN input exists here. SQL can target ONLY this newly created owned local
// Docker fixture; independently check its label before every DB operation.
export function localFixture() {
  const path = process.env.FEEDBACK_LOCAL_FIXTURE;
  if (!path || !/^H:[\\/]/i.test(path)) throw new Error("Owned H: local fixture manifest required");
  const fixture = JSON.parse(readFileSync(path, "utf8")) as { name: string; baseUrl: string; revision: string; productionDatabaseAccess: boolean };
  const url = new URL(fixture.baseUrl);
  if (fixture.revision !== "233e71562dda9ce3f7776e2fa52f23db3d96be21" || fixture.productionDatabaseAccess !== false || !/^homemind-e2e-[a-f0-9]{12}$/.test(fixture.name) || url.hostname !== "127.0.0.1" || url.protocol !== "http:" || url.pathname !== "/v1" || !url.port) throw new Error("Local fixture identity denied");
  const apiLabel = execFileSync("docker", ["inspect", "--format", '{{index .Config.Labels "vn.homemind.e2e.owner"}}', `${fixture.name}-api`], { encoding: "utf8" }).trim();
  const address = execFileSync("docker", ["port", `${fixture.name}-api`, "3000"], { encoding: "utf8" }).trim();
  if (apiLabel !== fixture.name || address !== `127.0.0.1:${url.port}` || url.username || url.password || url.search || url.hash) throw new Error("Owned API port mismatch");
  const sql = (query: string) => {
    const label = execFileSync("docker", ["inspect", "--format", '{{index .Config.Labels "vn.homemind.e2e.owner"}}', `${fixture.name}-db`], { encoding: "utf8" }).trim();
    if (label !== fixture.name) throw new Error("Local DB ownership mismatch");
    return execFileSync("docker", ["exec", "-i", `${fixture.name}-db`, "psql", "-U", "postgres", "-d", "homemind", "-v", "ON_ERROR_STOP=1", "-At"], { input: query, encoding: "utf8" }).trim();
  };
  const enabled = (value: boolean) => sql(`SELECT public.feedback_popup_admin_set(${value ? "true" : "false"}, NULL, NULL, gen_random_uuid());`);
  return { ...fixture, sql, enabled };
}
