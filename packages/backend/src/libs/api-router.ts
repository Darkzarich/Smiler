/* eslint-disable @typescript-eslint/no-explicit-any */
import express from 'express';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { z } from 'zod';
import authRequiredMiddleware from '@middlewares/auth-required';
import { validateRequest } from '@middlewares/validate';
import { asyncControllerErrorHandler } from '@utils/async-controller-error-handler';
import type { JsonSchema } from '@libs/openapi/registry';
import {
  registerApiRoute,
  registerApiTag,
  type ApiRequestSchemas,
  type ApiResponseDoc,
  type HttpMethod,
} from '@libs/openapi/routes';

/**
 * What the controller receives for a part of the request: the output of that
 * part's schema. A part with no schema stays `any`, which is what Express
 * itself hands over — a controller that wants a type for it declares one.
 */
type Parsed<Schema> = Schema extends z.ZodType ? z.infer<Schema> : any;

type RouteHandler<Schemas extends ApiRequestSchemas> = (
  req: Request<
    Parsed<Schemas['params']>,
    any,
    Parsed<Schemas['body']>,
    Parsed<Schemas['query']>
  >,
  res: Response<any>,
  next: NextFunction,
) => Promise<void> | void;

interface RouteConfig<Schemas extends ApiRequestSchemas> {
  /** The Express path, relative to where the router is mounted: `/:id/vote`. */
  path: string;
  summary: string;
  description?: string;
  /** Rejects the request with 401 unless it carries a session. */
  auth?: boolean;
  /** Every endpoint is rate limited; which limiter it gets says how cheap it
   * is to call. */
  rateLimiter: RequestHandler;
  /** Parsed before the controller runs, and documented from the same schemas. */
  request?: Schemas;
  /** Only for a body Zod cannot describe — the multipart upload. Written as an
   * OpenAPI request body object. */
  requestBody?: JsonSchema;
  /** The CSRF token is required for unsafe methods once a session exists, so
   * this follows `auth`. Sign-in and sign-up need one without a session yet. */
  csrf?: boolean;
  responses: Record<number, ApiResponseDoc>;
  handler: RouteHandler<Schemas>;
}

interface ApiRouterOptions {
  /** Where the router is mounted under `/api`: `/posts`. */
  prefix: string;
  tag: string;
  tagDescription: string;
}

/** `/:id/vote` under `/posts` is `/posts/{id}/vote` to OpenAPI. */
function toOpenApiPath(prefix: string, path: string) {
  const full = `${prefix}${path.replace(/:(\w+)/g, '{$1}')}`;

  return full.length > 1 && full.endsWith('/') ? full.slice(0, -1) : full;
}

function toSecurity(
  method: HttpMethod,
  { auth = false, csrf = auth && method !== 'get' }: RouteConfig<any>,
) {
  const schemes: Record<string, string[]> = {
    ...(auth && { cookieAuth: [] }),
    ...(csrf && { csrfToken: [] }),
  };

  return Object.keys(schemes).length > 0 ? [schemes] : [];
}

/**
 * A router that registers each endpoint once, for both the Express stack and
 * the OpenAPI document.
 *
 * The point of going through here rather than calling `router.get` directly is
 * that the request schemas cannot drift from the documentation: the schema that
 * rejects a bad request is the one the docs are generated from. Authentication,
 * rate limiting and the error responses every endpoint can produce come from
 * the same declaration, so the document stops being a thing to remember to
 * update.
 */
export function createApiRouter({
  prefix,
  tag,
  tagDescription,
}: ApiRouterOptions) {
  const router = express.Router();

  registerApiTag(tag, tagDescription);

  const define = <Schemas extends ApiRequestSchemas>(
    method: HttpMethod,
    config: RouteConfig<Schemas>,
  ) => {
    registerApiRoute({
      method,
      path: toOpenApiPath(prefix, config.path),
      tag,
      summary: config.summary,
      description: config.description,
      security: toSecurity(method, config),
      request: config.request,
      requestBody: config.requestBody,
      responses: config.responses,
    });

    // `method` is one of the four literals above, not anything a request
    // carries.
    // eslint-disable-next-line security/detect-object-injection
    router[method](
      config.path,
      ...(config.auth ? [authRequiredMiddleware] : []),
      config.rateLimiter,
      ...(config.request ? [validateRequest(config.request)] : []),
      asyncControllerErrorHandler(config.handler),
    );
  };

  return {
    get: <Schemas extends ApiRequestSchemas>(config: RouteConfig<Schemas>) =>
      define('get', config),
    post: <Schemas extends ApiRequestSchemas>(config: RouteConfig<Schemas>) =>
      define('post', config),
    put: <Schemas extends ApiRequestSchemas>(config: RouteConfig<Schemas>) =>
      define('put', config),
    delete: <Schemas extends ApiRequestSchemas>(config: RouteConfig<Schemas>) =>
      define('delete', config),
    router,
  };
}
