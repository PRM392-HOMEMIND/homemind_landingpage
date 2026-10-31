export interface Schema {
  $ref?: string;
  type?: string;
  nullable?: boolean;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
  additionalProperties?: boolean | Schema;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  writeOnly?: boolean;
  description?: string;
}
export class ContractError extends Error {
  constructor(public readonly field: string) {
    super("Dữ liệu máy chủ chưa tương thích với hợp đồng admin-v1.");
  }
}
// Response additions are tolerated by the versioned Markdown contract. Declared
// fields remain mandatory and are never coerced. Never include actual values in errors.
export function validateSchema(
  schema: Schema,
  value: unknown,
  schemas: Record<string, Schema>,
  field = "response",
): void {
  const fail = () => {
    throw new ContractError(field);
  };
  if (value === null) {
    if (schema.nullable || schema.enum?.includes(null)) return;
    fail();
  }
  if (schema.$ref)
    return validateSchema(
      schemas[schema.$ref.split("/").at(-1)!],
      value,
      schemas,
      field,
    );
  if (schema.enum && !schema.enum.includes(value)) fail();
  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      fail();
    const object = value as Record<string, unknown>;
    for (const key of schema.required || [])
      if (!Object.hasOwn(object, key))
        throw new ContractError(`${field}.${key}`);
    for (const [key, child] of Object.entries(schema.properties || {}))
      if (Object.hasOwn(object, key))
        validateSchema(child, object[key], schemas, `${field}.${key}`);
    if (typeof schema.additionalProperties === "object")
      for (const [key, child] of Object.entries(object))
        if (!schema.properties?.[key])
          validateSchema(
            schema.additionalProperties,
            child,
            schemas,
            `${field}.*`,
          );
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) fail();
    (value as unknown[]).forEach((item) =>
      validateSchema(schema.items!, item, schemas, `${field}[]`),
    );
  } else if (schema.type === "integer" || schema.type === "number") {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      (schema.type === "integer" && !Number.isSafeInteger(value))
    )
      fail();
    if (schema.minimum !== undefined && (value as number) < schema.minimum)
      fail();
    if (schema.maximum !== undefined && (value as number) > schema.maximum)
      fail();
  } else if (schema.type === "boolean") {
    if (typeof value !== "boolean") fail();
  } else if (schema.type === "string") {
    if (typeof value !== "string") fail();
    const string = value as string;
    if (
      (schema.minLength !== undefined && string.length < schema.minLength) ||
      (schema.maxLength !== undefined && string.length > schema.maxLength)
    )
      fail();
    if (schema.pattern && !new RegExp(schema.pattern).test(string)) fail();
    if (
      schema.format === "uuid" &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        string,
      )
    )
      fail();
    // OpenAPI date-time is RFC3339, including explicit offsets and DB microseconds.
    if (schema.format === "date-time") {
      if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          string,
        ) ||
        !Number.isFinite(Date.parse(string))
      )
        fail();
      const calendar = string.slice(0, 10);
      if (
        new Date(`${calendar}T00:00:00Z`).toISOString().slice(0, 10) !==
        calendar
      )
        fail();
    }
    if (
      schema.format === "date" &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(string) ||
        !Number.isFinite(Date.parse(`${string}T00:00:00Z`)) ||
        new Date(`${string}T00:00:00Z`).toISOString().slice(0, 10) !== string)
    )
      fail();
    if (schema.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(string))
      fail();
  }
}
