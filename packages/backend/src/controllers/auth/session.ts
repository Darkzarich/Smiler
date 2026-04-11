import type { Request } from 'express';

type SessionRequest = Pick<Request, 'session'>;

export async function authenticateSession(req: SessionRequest, userId: string) {
  const { csrfToken } = req.session;

  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  req.session.userId = userId;

  if (csrfToken) {
    req.session.csrfToken = csrfToken;
  }
}
