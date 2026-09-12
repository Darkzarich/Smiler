import type { z } from 'zod';
import Config from '@config/index';
import { SESSION_COOKIE_NAME } from '@constants/index';
import { errorResponseSchema } from '@validators/common';
import {
  buildComponentSchemas,
  inlineSchema,
  schemaObject,
  type JsonSchema,
} from './registry';
import {
  getApiRoutes,
  getApiTags,
  type ApiResponseDoc,
  type ApiRouteDoc,
} from './routes';

const API_DESCRIPTION = `Smiler is my own MEVN (MongoDB, Express, Vue.js, Node.js) site similar to reddit.com or 9gag.com (mostly takes many known features) with many different and awesome features, open Swagger API docs, tests, interesting tools and more. Main reason of making this site is fun and learning new things while making it.

Requests and responses are described by the same [Zod](https://zod.dev) schemas the server validates against, so nothing here can drift from what the endpoints accept.`;

const securitySchemes = {
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: SESSION_COOKIE_NAME,
    description: 'The session cookie, set by sign-in and sign-up.',
  },
  csrfToken: {
    type: 'apiKey',
    in: 'header',
    name: 'X-CSRF-Token',
    description:
      'Required on every unsafe request made with a session. Read it from `GET /auth/csrf`.',
  },
};

function requiresScheme(route: ApiRouteDoc, scheme: string) {
  return route.security.some((requirement) => scheme in requirement);
}

/**
 * The failures that follow from how an endpoint is wired rather than from what
 * it does, so that no route has to remember to list them.
 */
const IMPLIED_RESPONSES: {
  status: number;
  description: string;
  applies: (route: ApiRouteDoc) => boolean;
}[] = [
  {
    status: 401,
    description: 'No session, or the session has expired',
    applies: (route) => requiresScheme(route, 'cookieAuth'),
  },
  {
    status: 403,
    description: 'The CSRF token is missing or does not match the session',
    applies: (route) => requiresScheme(route, 'csrfToken'),
  },
  {
    status: 422,
    description: 'The request does not match the schemas above',
    applies: (route) => Boolean(route.request),
  },
  {
    status: 429,
    description: 'Too many requests — see the rate limit headers',
    applies: () => true,
  },
  {
    status: 500,
    description: 'Something went wrong on the server',
    applies: () => true,
  },
];

function impliedResponses(route: ApiRouteDoc): Record<number, ApiResponseDoc> {
  return Object.fromEntries(
    IMPLIED_RESPONSES.filter(({ applies }) => applies(route)).map(
      ({ status, description }) => [status, { description }],
    ),
  );
}

function toResponseObject(status: number, response: ApiResponseDoc) {
  // Every error this API sends shares one shape, so a route only has to say
  // what the status means.
  const schema =
    response.schema ?? (status >= 400 ? errorResponseSchema : undefined);

  return {
    description: response.description,
    ...(response.headers && { headers: response.headers }),
    ...(schema && {
      content: { 'application/json': { schema: schemaObject(schema) } },
    }),
  };
}

function toResponses(route: ApiRouteDoc) {
  const responses = { ...impliedResponses(route), ...route.responses };

  return Object.fromEntries(
    Object.entries(responses).map(([status, response]) => [
      status,
      toResponseObject(Number(status), response),
    ]),
  );
}

/** A repeated query parameter (`?tags[]=a&tags[]=b`) arrives as an array, which
 * is what `explode` describes. */
function isArrayLike(schema: JsonSchema) {
  const alternatives = (schema.anyOf ?? []) as JsonSchema[];

  return (
    schema.type === 'array' ||
    alternatives.some((alternative) => alternative.type === 'array')
  );
}

function toParameters(
  schema: z.ZodType | undefined,
  location: 'path' | 'query',
) {
  if (!schema) {
    return [];
  }

  const json = inlineSchema(schema);
  const properties = (json.properties ?? {}) as Record<string, JsonSchema>;
  const required = new Set((json.required ?? []) as string[]);

  return Object.entries(properties).map(
    ([name, { description, ...parameterSchema }]) => ({
      name,
      in: location,
      // A path parameter is part of the path: there is no request without it.
      required: location === 'path' || required.has(name),
      ...(typeof description === 'string' && { description }),
      ...(isArrayLike(parameterSchema) && { style: 'form', explode: true }),
      schema: parameterSchema,
    }),
  );
}

function toRequestBody(route: ApiRouteDoc) {
  if (route.requestBody) {
    return route.requestBody;
  }

  if (!route.request?.body) {
    return undefined;
  }

  return {
    required: true,
    content: {
      'application/json': { schema: schemaObject(route.request.body) },
    },
  };
}

/** `putPostsIdVote` — stable enough for a generated client to name a method
 * after. */
function toOperationId({ method, path }: ApiRouteDoc) {
  const name = path
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.replace(/[{}]/g, ''))
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join('');

  return `${method}${name}`;
}

function toOperation(route: ApiRouteDoc) {
  const parameters = [
    ...toParameters(route.request?.params, 'path'),
    ...toParameters(route.request?.query, 'query'),
  ];

  return {
    operationId: toOperationId(route),
    tags: [route.tag],
    summary: route.summary,
    ...(route.description && { description: route.description }),
    ...(route.security.length > 0 && { security: route.security }),
    ...(parameters.length > 0 && { parameters }),
    ...(toRequestBody(route) && { requestBody: toRequestBody(route) }),
    responses: toResponses(route),
  };
}

function toPaths(routes: readonly ApiRouteDoc[]) {
  return routes.reduce<Record<string, Record<string, unknown>>>(
    (paths, route) => ({
      ...paths,
      [route.path]: {
        ...paths[route.path],
        [route.method]: toOperation(route),
      },
    }),
    {},
  );
}

/**
 * Assembles the OpenAPI document from the routes registered by
 * `createApiRouter`. Call it once every route module has been imported.
 */
export function buildOpenApiDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Smiler API',
      version: '1.0.0',
      description: API_DESCRIPTION,
      license: { name: 'MIT', identifier: 'MIT' },
    },
    servers: [
      {
        url: 'https://smiler-api.darkzarich.com/api',
        description: 'Production server',
      },
      {
        url: `http://localhost:${Config.PORT}/api`,
        description: 'Local server',
      },
    ],
    tags: getApiTags(),
    paths: toPaths(getApiRoutes()),
    components: {
      securitySchemes,
      schemas: buildComponentSchemas(),
    },
  };
}
