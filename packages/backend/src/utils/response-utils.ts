import type { Response } from 'express';

export function sendSuccess<Res extends Response>(
  res: Res,
  data?: Res extends Response<infer ResBody> ? ResBody | null : never,
) {
  res.status(200).json(
    data || {
      ok: true,
    },
  );
}
