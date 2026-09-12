import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { ValidationError, type ValidationIssue } from '@errors';
import type { ApiRequestSchemas } from '@libs/openapi/routes';

type RequestPart = 'params' | 'query' | 'body';

/**
 * Where the parsed value goes. `body` is a plain property, but Express defines
 * `query` (and, for the mounted router, `params`) as a getter on the request
 * prototype, so a plain assignment would throw instead of replacing it.
 */
function setRequestPart(req: Request, part: RequestPart, value: unknown) {
  Object.defineProperty(req, part, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

/**
 * A query parameter sent with nothing after the `=` means the client left it
 * blank, not that it holds an empty string: `?limit=&offset=` has to fall back
 * to the defaults rather than fail as "not a number". Forms submit exactly
 * that for every untouched field.
 */
function withoutBlankValues(query: unknown) {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== ''),
  );
}

/** `sections[0].url` — how the failing field is named back to the client. */
function formatIssuePath(path: readonly PropertyKey[], part: RequestPart) {
  if (path.length === 0) {
    return part;
  }

  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === 'number') {
      return `${formatted}[${segment}]`;
    }

    return formatted ? `${formatted}.${String(segment)}` : String(segment);
  }, '');
}

function toValidationIssues(
  error: z.ZodError,
  part: RequestPart,
): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: formatIssuePath(issue.path, part),
    message: issue.message,
  }));
}

/**
 * Parses the request against the schemas of its route and replaces `params`,
 * `query` and `body` with the result, so a controller only ever sees data of
 * the shape (and the type) its route declared.
 *
 * Every part is parsed even when an earlier one failed, and every issue is
 * reported: a client fixing one field at a time is the slowest possible way to
 * learn what an endpoint wants. The `message` the UI shows is still a single
 * one — the first problem found, in the order the schemas declare their
 * fields.
 */
export function validateRequest(schemas: ApiRequestSchemas): RequestHandler {
  const parts: {
    part: RequestPart;
    schema?: z.ZodType;
    read: (req: Request) => unknown;
  }[] = [
    { part: 'params', schema: schemas.params, read: (req) => req.params },
    {
      part: 'query',
      schema: schemas.query,
      read: (req) => withoutBlankValues(req.query),
    },
    { part: 'body', schema: schemas.body, read: (req) => req.body },
  ];

  return (req: Request, _res: Response, next: NextFunction) => {
    const issues: ValidationIssue[] = [];

    parts.forEach(({ part, schema, read }) => {
      if (!schema) {
        return;
      }

      const result = schema.safeParse(read(req) ?? {});

      if (result.success) {
        setRequestPart(req, part, result.data);

        return;
      }

      issues.push(...toValidationIssues(result.error, part));
    });

    if (issues.length > 0) {
      next(new ValidationError(issues[0].message, issues));

      return;
    }

    next();
  };
}
