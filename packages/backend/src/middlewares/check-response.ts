import type { RequestHandler } from 'express';
import { z } from 'zod';

/**
 * Parses the body of a 200 against the schema the route documents for it, and
 * throws when the two disagree, so the request fails with a 500.
 *
 * The types already hold a handler to its schema; this catches what they cannot
 * see: a cast, an `any` handed back by Mongoose, a stored document older than
 * its type. It costs a serialize and a parse per response, so the router only
 * mounts it under Jest, where the integration tests then fail on any response
 * the API document does not describe.
 */
export function checkResponse(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const send = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode === 200) {
        // What the client receives, with every Date and ObjectId already a
        // string, is what the schema describes.
        const result = schema.safeParse(JSON.parse(JSON.stringify(body)));

        if (!result.success) {
          throw new Error(
            `The response to ${req.method} ${req.originalUrl} does not match its schema:\n${z.prettifyError(result.error)}`,
          );
        }
      }

      return send(body);
    };

    next();
  };
}
