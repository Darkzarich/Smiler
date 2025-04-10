import type { Response } from 'express';

export function sendSuccess<Res extends Response>(
  res: Res,
  data?: Res extends Response<infer ResBody> ? ResBody | null : never,
) {
  const response = data || {
    ok: true,
  };

  // Providing for logs
  res.response = response;

  res.status(200).json(response);
}
