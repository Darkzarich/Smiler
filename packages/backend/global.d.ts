declare namespace Express {
  export interface Request {
    id: string;
    session?: {
      userId: string;
    };
  }

  export interface Response {
    response: Record<string, unknown>;
  }
}
