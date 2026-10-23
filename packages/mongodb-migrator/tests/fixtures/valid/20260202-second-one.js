exports.default = {
  critical: false,
  up: async () => ({ touched: 0 }),
  down: { kind: 'irreversible', reason: 'it is a fixture' },
};
