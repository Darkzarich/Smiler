export default async () => {
  await global.mongod.stop();
};
