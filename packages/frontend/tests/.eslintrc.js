module.exports = {
  root: false,
  extends: ['plugin:playwright/recommended'],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.ts'],
      },
      alias: {
        map: [
          ['@api', './src/api'],
          ['@factory', './tests/integration/factory'],
        ],
        extensions: ['.ts'],
      },
    },
  },
};
