import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    csrfToken?: string;
  }
}

declare global {
  namespace Express {
    export interface Request {
      id: string;
      file?: Express.Multer.File;
      routeBaseUrl?: string;
    }
  }
}
