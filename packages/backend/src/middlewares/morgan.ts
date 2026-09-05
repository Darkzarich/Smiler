// Morgan is a middleware for logging HTTP requests in a provided format

import morgan from 'morgan';
import type { Request, Response } from 'express';
import { logger } from '@libs/logger';
import { getRouteTemplate } from '@utils/route-template';

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

/**
 * A request that failed because the server broke is the only kind worth waking
 * someone for. A 4xx means the client sent something the API rejected, which is
 * ordinary traffic for a public endpoint — it stays at info and is found by
 * filtering on `status`, not by its level.
 */
function getLevelForStatus(status: number): 'error' | 'info' {
  return status >= 500 ? 'error' : 'info';
}

export default morgan(
  (tokens, req: Request, res: Response) =>
    JSON.stringify({
      requestId: req.id,
      userId: req.session?.userId,
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
        const payload = JSON.parse(message) as { status: number };

        logger.log(getLevelForStatus(payload.status), 'http_request', payload);
      },
    },
  },
);
