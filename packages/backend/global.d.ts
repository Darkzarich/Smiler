declare namespace Express {
  export interface Request {
    id: string;
    session: {
      userId?: string;
      destroy?(): void;
    };
    file?: Express.Multer.File;
  }

  export interface Response {
    response: Record<string, unknown>;
  }
}
