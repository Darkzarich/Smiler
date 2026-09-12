import { z } from 'zod';

/**
 * The schemas that get a name of their own in the generated OpenAPI document.
 *
 * A schema registered here is emitted once under `components/schemas` and
 * referenced by `$ref` everywhere it is used, so the document stays readable
 * and a client generator produces one type per concept instead of one per
 * endpoint. Everything else — one-off request bodies, path and query
 * parameters — is inlined at its use site.
 */
const registry = z.registry<{ id: string }>();

/** A plain JSON Schema object, as `z.toJSONSchema` produces it. */
export type JsonSchema = Record<string, unknown>;

/** Names a schema for `components/schemas` and returns it unchanged, so the
 * declaration reads as one expression:
 *
 * ```ts
 * export const okSchema = apiSchema('OK', z.object({ ok: z.literal(true) }));
 * ```
 */
export function apiSchema<T extends z.ZodType>(id: string, schema: T): T {
  registry.add(schema, { id });

  return schema;
}

function schemaRef(schema: z.ZodType): string | undefined {
  const id = registry.get(schema)?.id;

  return id ? `#/components/schemas/${id}` : undefined;
}

/**
 * Requests are described by the shape a client has to send, which is the
 * *input* side of a schema: `sanitizeHtml` transforms, `Number` coercion of
 * query strings and defaults all happen during parsing, and a client knows
 * nothing about their results.
 *
 * Response schemas are written without transforms or defaults for the same
 * reason, so one conversion mode serves both.
 */
const JSON_SCHEMA_OPTIONS = {
  io: 'input',
  target: 'draft-2020-12',
  // A document is worth less than a running server: anything with no JSON
  // Schema equivalent becomes `{}` rather than throwing at boot.
  unrepresentable: 'any',
} as const;

/** Drops the keys that belong to a standalone JSON Schema document but not to
 * an OpenAPI schema object. */
function stripJsonSchemaKeys({
  $schema,
  $id,
  ...schema
}: JsonSchema): JsonSchema {
  return schema;
}

export function inlineSchema(schema: z.ZodType): JsonSchema {
  return stripJsonSchemaKeys(z.toJSONSchema(schema, JSON_SCHEMA_OPTIONS));
}

/** Either a `$ref` to the named schema or its JSON Schema inlined. */
export function schemaObject(schema: z.ZodType): JsonSchema {
  const ref = schemaRef(schema);

  return ref ? { $ref: ref } : inlineSchema(schema);
}

/** Every named schema, converted in one pass so that the references between
 * them come out as `$ref`s rather than repeated copies. */
export function buildComponentSchemas(): Record<string, JsonSchema> {
  const { schemas } = z.toJSONSchema(registry, {
    ...JSON_SCHEMA_OPTIONS,
    uri: (id) => `#/components/schemas/${id}`,
  });

  return Object.fromEntries(
    Object.entries(schemas).map(([id, schema]) => [
      id,
      stripJsonSchemaKeys(schema),
    ]),
  );
}
