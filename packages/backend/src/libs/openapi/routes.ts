import type { z } from 'zod';
import type { JsonSchema } from './registry';

export type HttpMethod = 'get' | 'post' | 'put' | 'delete';

export interface ApiRequestSchemas {
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
}

export interface ApiResponseDoc {
  description: string;
  /** The response payload. A status of 400 or more falls back to the shared
   * error schema, since every error this API sends has the same shape. */
  schema?: z.ZodType;
  headers?: Record<string, JsonSchema>;
}

export interface ApiRouteDoc {
  method: HttpMethod;
  /** The OpenAPI form of the path, with `{braces}` around the parameters:
   * `/posts/{id}/vote`. */
  path: string;
  tag: string;
  summary: string;
  description?: string;
  security: Record<string, string[]>[];
  request?: ApiRequestSchemas;
  /** For a body OpenAPI can describe and Zod cannot — the multipart upload. */
  requestBody?: JsonSchema;
  responses: Record<number, ApiResponseDoc>;
}

const routes: ApiRouteDoc[] = [];
const tags = new Map<string, string>();

export function registerApiTag(name: string, description: string) {
  tags.set(name, description);
}

export function registerApiRoute(route: ApiRouteDoc) {
  routes.push(route);
}

export function getApiRoutes(): readonly ApiRouteDoc[] {
  return routes;
}

export function getApiTags() {
  return Array.from(tags, ([name, description]) => ({ name, description }));
}
