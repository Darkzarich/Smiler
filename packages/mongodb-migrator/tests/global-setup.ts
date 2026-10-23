import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

export default async function setup(project: TestProject) {
  const mongod = await MongoMemoryServer.create({
    binary: { version: '8.0.29' },
  });

  project.provide('mongoUri', mongod.getUri());

  return async () => {
    await mongod.stop();
  };
}
