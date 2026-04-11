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
