import type { Request, Response } from 'express';
import { SESSION_COOKIE_NAME } from '@constants/index';
import { sendSuccess } from '@utils/response-utils';

export async function logout(req: Request, res: Response) {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  res.clearCookie(SESSION_COOKIE_NAME);

  sendSuccess(res);
}
