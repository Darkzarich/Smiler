/* eslint-disable no-var */
/* eslint-disable vars-on-top */

import type { Express } from 'express';
import type { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  /** Global mongod instance for for Jest */
  var mongod: MongoMemoryServer;
  /* 8 Global app instance for for Jest */
  var app: Express;

  // namespace NodeJS {
  //   interface Global {
  //     app: Express;
  //     mongod: MongoMemoryServer;
  //   }
  // }
}
