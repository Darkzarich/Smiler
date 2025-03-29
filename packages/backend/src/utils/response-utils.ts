import type { Response } from 'express';

export function sendSuccess(
  res: Response,
  data?: Record<string | number | symbol, unknown>,
) {
  const response = data || {
    ok: true,
  };

  // Providing for logs
  res.response = response;

  res.status(200).json(response);
}
