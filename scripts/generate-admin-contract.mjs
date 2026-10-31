import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const rawInput = await readFile(
  new URL("../docs/HOMEMIND_ADMIN_OPENAPI.json", import.meta.url),
  "utf8",
);
const input=rawInput.replaceAll('\r\n','\n');
const document = JSON.parse(input);
const schemas = document.components.schemas;
function type(schema) {
  let result;
  if (schema.$ref) result = schema.$ref.split("/").at(-1);
  else if (schema.enum)
    result = schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  else if (schema.type === "array") result = `Array<${type(schema.items)}>`;
  else if (schema.type === "object") {
    const fields = Object.entries(schema.properties || {})
      .map(
        ([key, value]) =>
          `${JSON.stringify(key)}${schema.required?.includes(key) ? "" : "?"}: ${type(value)}`,
      )
      .join("; ");
    result =
      schema.additionalProperties &&
      typeof schema.additionalProperties === "object"
        ? `Record<string, ${type(schema.additionalProperties)}>`
        : fields
          ? `{ ${fields} }`
          : "Record<string, never>";
  } else
    result =
      {
        integer: "number",
        number: "number",
        boolean: "boolean",
        string: "string",
      }[schema.type] || "unknown";
  return schema.nullable && !schema.enum?.includes(null)
    ? `(${result}) | null`
    : result;
}
const operations = {};
for (const [path, methods] of Object.entries(document.paths))
  for (const [method, operation] of Object.entries(methods)) {
    const response = operation.responses["200"].content[
      "application/json"
    ].schema.properties.data.$ref
      .split("/")
      .at(-1);
    operations[operation.operationId] = {
      path,
      method: method.toUpperCase(),
      response,
      query: operation.parameters
        .filter((p) => p.in === "query")
        .map((p) => p.name),
      requiredQuery: operation.parameters
        .filter((p) => p.in === "query" && p.required)
        .map((p) => p.name),
      params: operation.parameters
        .filter((p) => p.in === "path")
        .map((p) => p.name),
      authenticated: !!operation.security.length,
    };
  }
if (Object.keys(operations).length !== 36)
  throw new Error("Unexpected admin operation count");
const banner = `// Generated from HOMEMIND_ADMIN_OPENAPI.json; do not edit.\n// SHA256: ${createHash("sha256").update(input).digest("hex")}\n`;
const types =
  banner +
  Object.entries(schemas)
    .map(
      ([name, schema]) =>
        `export type ${name === "Error" ? "ErrorEnvelope" : name} = ${type(schema)};`,
    )
    .join("\n") +
  "\n" +
  `export interface Responses {\n${Object.entries(operations)
    .map(([id, op]) => `  ${id}: ${op.response};`)
    .join("\n")}\n}\n` +
  `export interface Inputs {\n${Object.entries(operations)
    .map(
      ([id, op]) =>
        `  ${id}: { params${op.params.length ? "" : "?"}: ${op.params.length ? `{ ${op.params.map((p) => `${p}: string`).join("; ")} }` : "Record<string, never>"}; query${op.requiredQuery.length ? "" : "?"}: ${op.query.length ? `{ ${op.query.map((p) => `${p}${op.requiredQuery.includes(p) ? "" : "?"}: string`).join("; ")} }` : "Record<string, never>"}${id === "adminLogin" ? "; body: AdminLoginDto" : ""} };`,
    )
    .join("\n")}\n}\n`;
const runtime =
  banner +
  `import type { Schema } from './schema';\nexport const schemas: Record<string, Schema> = ${JSON.stringify(schemas, null, 2)};\nexport const operations = ${JSON.stringify(operations, null, 2)} as const;\nexport type OperationId = keyof typeof operations;\n`;
const directory = new URL("../src/lib/admin-api/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const [name, content] of [
  ["types.ts", types],
  ["contract.ts", runtime],
]) {
  const path = new URL(name, directory);
  if (process.argv.includes("--check")) {
    if ((await readFile(path, "utf8")).replaceAll('\r\n','\n') !== content)
      throw new Error(`Generated contract stale: ${name}`);
  } else await writeFile(path, content);
}
console.log(
  `Contract ${process.argv.includes("--check") ? "consistent" : "generated"}: 36 operations, ${Object.keys(schemas).length} schemas`,
);
