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

declare module 'rate-limit-mongo' {
  import type { Store } from 'express-rate-limit';

  interface MongoStoreOptions {
    uri: string;
    collectionName?: string;
    expireTimeMs?: number;
  }

  const MongoStore: {
    new (options: MongoStoreOptions): Store;
  };

  export = MongoStore;
}
