module.exports = {
  root: false,
  env: {
    commonjs: true,
    es2022: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:node/recommended',
    'plugin:security/recommended-legacy',
    'prettier',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2022,
  },
  rules: {
    'consistent-return': 'off',
    'no-underscore-dangle': [
      'error',
      { allow: ['_id', '_handleFile', '_removeFile'] },
    ],
    'node/no-unpublished-require': 'off',
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
  },
  overrides: [
    {
      files: ['**/*.spec.js'],
      env: {
        jest: true,
      },
    },
  ],
};
