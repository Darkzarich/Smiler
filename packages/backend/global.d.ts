declare namespace Express {
  export interface Request {
    id: string;
    session: {
      userId?: string;
      destroy?(): void;
    };
  }

  export interface Response {
    response: Record<string, unknown>;
  }
}
