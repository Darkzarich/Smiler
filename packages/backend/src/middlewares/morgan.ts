// Morgan is a middleware for logging HTTP requests in a provided format

import morgan from 'morgan';
import type { Request, Response } from 'express';
import { logger } from '@libs/logger';

function stringifyRoutePath(path: unknown): string {
  if (typeof path === 'string') {
    return path;
  }

  if (path instanceof RegExp) {
    return '[pattern]';
  }

  if (Array.isArray(path)) {
    return path.map(stringifyRoutePath).join('|');
  }

  return '[unknown]';
}

function getRouteTemplate(req: Request): string {
  if (!req.route) {
    return '[unmatched]';
  }

  return `${req.baseUrl}${stringifyRoutePath(req.route.path)}`;
}

function getContentLength(
  contentLength: string | undefined,
): number | undefined {
  if (contentLength === undefined) {
    return undefined;
  }

  const parsedContentLength = Number.parseInt(String(contentLength), 10);

  if (Number.isNaN(parsedContentLength)) {
    return undefined;
  }

  return parsedContentLength;
}

export default morgan(
  (tokens, req: Request, res: Response) =>
    JSON.stringify({
      requestId: req.id,
      method: tokens.method(req, res),
      route: getRouteTemplate(req),
      path: req.path,
      status: Number.parseFloat(tokens.status(req, res)!) || 0,
      content_length: getContentLength(tokens.res(req, res, 'content-length')),
      response_time_ms:
        Number.parseFloat(tokens['response-time'](req, res)!) || 0,
    }),
  {
    stream: {
      write: (message) => {
        logger.info('http_request', JSON.parse(message));
      },
    },
  },
);
