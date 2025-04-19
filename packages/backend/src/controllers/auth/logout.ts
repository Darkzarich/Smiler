import type { Request, Response } from 'express';
import { sendSuccess } from '@utils/response-utils';

export async function logout(req: Request, res: Response) {
  if (req.session) {
    req.session.destroy!();
  }

  sendSuccess(res);
}
