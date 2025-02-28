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
    'node/no-unpublished-import': 'off',
  },
  overrides: [
    {
      files: ['**/*.spec.js', 'src/tests/**/*.js'],
      env: {
        jest: true,
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
