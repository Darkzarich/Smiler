// Morgan is a middleware for logging HTTP requests in a provided format

import morgan, { token } from 'morgan';
import type { Request, Response } from 'express';
import { logger } from '@libs/logger';

token('request-body', (req: Request) => {
  const body = { ...req.body };

  // Clean sensitive data
  if ('password' in body) {
    body.password = '***';
  }

  if ('confirm' in body) {
    body.confirm = '***';
  }

  return body;
});

export default morgan(
  (tokens, req: Request, res: Response) =>
    JSON.stringify({
      requestId: req.id,
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number.parseFloat(tokens.status(req, res)!) || 0,
      uid: req.session ? req.session.userId : 'no user',
      content_length: tokens.res(req, res, 'content-length'),
      response_time: Number.parseFloat(tokens['response-time'](req, res)!) || 0,
      body: tokens['request-body'](req, res),
      response: res.response,
    }),
  {
    stream: {
      write: (message) => {
        logger.info(message);
      },
    },
  },
);
