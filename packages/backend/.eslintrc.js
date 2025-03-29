module.exports = {
  parser: '@typescript-eslint/parser',
  root: false,
  env: {
    commonjs: true,
    es2022: true,
    node: true,
  },
  extends: [
    'plugin:node/recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:security/recommended-legacy',
    'prettier',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.js'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  rules: {
    // Deprecated rules, but are used in airbnb-typescript
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/only-throw-error': 'error',
    'node/no-missing-import': 'off',
    'node/no-unsupported-features/es-syntax': [
      'error',
      { ignores: ['modules'] },
    ],
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
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
      // alias: {
      //   map: [
      //     ['@', './src'],
      //     ['@components', './src/components'],
      //     ['@common', './src/components/common'],
      //     ['@icons', './src/components/common/icons'],
      //   ],
      //   extensions: ['.js', '.ts'],
      // },
    },
  },
  overrides: [
    {
      files: [
        '**/*.spec.js',
        '**/*.spec.ts',
        'src/tests/**/*.js',
        'src/tests/**/*.ts',
      ],
      env: {
        jest: true,
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
