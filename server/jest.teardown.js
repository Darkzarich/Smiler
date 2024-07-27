module.exports = async () => {
  await global.mongod.stop();
};
