/* eslint-disable @typescript-eslint/no-explicit-any */
import '@routes/index';
import { buildOpenApiDocument } from '@libs/openapi/document';
import { getApiRoutes } from '@libs/openapi/routes';

type JsonValue = Record<string, unknown> | unknown[] | string | number | null;

function collectRefs(node: JsonValue, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((item) => collectRefs(item as JsonValue, found));

    return found;
  }

  if (typeof node !== 'object' || node === null) {
    return found;
  }

  Object.entries(node).forEach(([key, value]) => {
    if (key === '$ref' && typeof value === 'string') {
      found.push(value);

      return;
    }

    collectRefs(value as JsonValue, found);
  });

  return found;
}

describe('The OpenAPI document', () => {
  const document = buildOpenApiDocument();
  const operations = Object.entries(document.paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, operation]) => ({
      name: `${method.toUpperCase()} ${path}`,
      operation: operation as Record<string, any>,
    })),
  );

  it('Describes every registered route', () => {
    // Importing the routes is what registers them, so an empty document means
    // the router wiring stopped going through `createApiRouter`.
    expect(getApiRoutes().length).toBeGreaterThan(0);
    expect(operations).toHaveLength(getApiRoutes().length);
  });

  it('Resolves every $ref against a declared component', () => {
    const declared = Object.keys(document.components.schemas);
    const referenced = collectRefs(document as unknown as JsonValue);

    expect(referenced.length).toBeGreaterThan(0);

    const dangling = referenced.filter(
      (ref) => !declared.includes(ref.replace('#/components/schemas/', '')),
    );

    expect(dangling).toEqual([]);
  });

  it('Gives every operation a summary, a tag and a success response', () => {
    const declaredTags = document.tags.map(({ name }) => name);

    operations.forEach(({ name, operation }) => {
      expect(operation.summary).toBeTruthy();
      expect(declaredTags).toContain(operation.tags[0]);
      expect(Object.keys(operation.responses)).toContain('200');
      expect(name).toBeTruthy();
    });
  });

  it('Documents the failures that follow from how a route is wired', () => {
    operations.forEach(({ operation }) => {
      const statuses = Object.keys(operation.responses);

      expect(statuses).toContain('429');
      expect(statuses).toContain('500');

      const requiresSession = (operation.security ?? []).some(
        (requirement: Record<string, unknown>) => 'cookieAuth' in requirement,
      );

      if (requiresSession) {
        expect(statuses).toContain('401');
      }

      if (operation.requestBody || operation.parameters) {
        expect(statuses).toContain('422');
      }
    });
  });

  it('Names every component schema it declares only once', () => {
    const ids = Object.keys(document.components.schemas);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
