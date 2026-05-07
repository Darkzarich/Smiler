/* eslint-disable func-names */
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const REQUEST_PROPERTY = 'id';
const REQUEST_HEADER = 'X-Request-Id';
const MAX_SAFE_REQUEST_ID_LENGTH = 64;
const SAFE_REQUEST_ID_REGEXP = new RegExp(
  `^[A-Za-z0-9._-]{1,${MAX_SAFE_REQUEST_ID_LENGTH}}$`,
);
const UUID_REQUEST_ID_REGEXP =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidRequestId(value: string): boolean {
  return (
    UUID_REQUEST_ID_REGEXP.test(value) || SAFE_REQUEST_ID_REGEXP.test(value)
  );
}

export function requestIdMiddleware(): RequestHandler {
  return function (request, response, next) {
    const oldValue = request.get(REQUEST_HEADER);
    const id =
      oldValue !== undefined && isValidRequestId(oldValue)
        ? oldValue
        : randomUUID();

    response.set(REQUEST_HEADER, id);

    // eslint-disable-next-line security/detect-object-injection
    request[REQUEST_PROPERTY] = id;

    next();
  };
}
