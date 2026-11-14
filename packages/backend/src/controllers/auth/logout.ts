import type { Request } from 'express';
import { SESSION_COOKIE_NAME } from '@constants/index';
import { sendSuccess } from '@utils/response-utils';
import type { ApiResponse } from '@libs/api-router';
import type { okResponseSchema } from '@validators/common';

export async function logout(
  req: Request,
  res: ApiResponse<typeof okResponseSchema>,
) {
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
