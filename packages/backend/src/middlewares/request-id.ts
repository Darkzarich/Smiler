import { v4 as uuidv4 } from 'uuid';
import type { RequestHandler } from 'express';

const REQUEST_PROPERTY = 'id';
const REQUEST_HEADER = 'X-Request-Id';

export function requestIdMiddleware(): RequestHandler {
  return function (request, response, next) {
    const oldValue = request.get(REQUEST_HEADER);
    const id = oldValue === undefined ? uuidv4() : oldValue;

    response.set(REQUEST_HEADER, id);

    // TODO: fix this
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    request[REQUEST_PROPERTY] = id;

    next();
  };
}
