import { MongoMemoryServer } from 'mongodb-memory-server';
import { engines } from '../package.json';

// On an unsupported Node the suite dies deep inside Jest's ESM interop with a
// `createRequireEsmError` pointing at whichever transitive dependency happens to
// be ESM-only, which says nothing about the real cause. Fail up front instead.
function assertSupportedNodeVersion() {
  const [required] = engines.node.replace(/[^\d.]/g, '').split('.');
  const [current] = process.versions.node.split('.');

  if (Number(current) < Number(required)) {
    throw new Error(
      `Node v${required} or newer is required, got v${process.versions.node}. ` +
        'Run `nvm use` to switch to the version pinned in .nvmrc.',
    );
  }
}

export default async () => {
  assertSupportedNodeVersion();

  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Running tests in a production environment!');
  }

  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27018,
    },
    binary: {
      version: '8.0.29',
    },
  });

  process.env.DB_URL = `${mongod.getUri()}smiler-test`;

  global.mongod = mongod;
};
