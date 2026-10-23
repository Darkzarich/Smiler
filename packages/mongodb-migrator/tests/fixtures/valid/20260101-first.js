exports.default = {
  critical: true,
  up: async ({ db }) => {
    await db.collection('fixtures').insertOne({ _id: 'first' });
  },
  down: async ({ db }) => {
    await db.collection('fixtures').deleteOne({ _id: 'first' });
  },
};
