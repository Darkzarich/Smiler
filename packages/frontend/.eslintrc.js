//TODO: Use new eslint api
module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  plugins: ['@typescript-eslint', 'vue'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    '@vue/eslint-config-typescript/recommended',
    'plugin:vuejs-accessibility/recommended',
    'plugin:prettier/recommended',
    'prettier',
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  ignorePatterns: ['src/components/common/icons/**', '.eslintrc.js'],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: true,
        packageDir: [__dirname],
      },
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-new': 'error',
    'no-var': 'error',
    curly: ['warn', 'all'],
    'operator-assignment': ['error', 'never'],
    'import/order': [
      'error',
      { alphabetize: { order: 'asc' }, 'newlines-between': 'never' },
    ],
    'import/no-cycle': 'warn',
    'import/extensions': 'off',
    'vue/component-name-in-template-casing': [
      'warn',
      'PascalCase',
      { registeredComponentsOnly: false },
    ],
    'vue/max-len': [
      'error',
      {
        code: 100,
        template: 100,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreHTMLAttributeValues: true,
      },
    ],
    'vue/padding-line-between-blocks': ['error', 'always'],
    'vue/block-tag-newline': [
      'warn',
      {
        singleline: 'always',
        multiline: 'always',
        maxEmptyLines: 1,
        blocks: {
          template: {
            singleline: 'always',
            multiline: 'always',
            maxEmptyLines: 1,
          },
          script: {
            singleline: 'always',
            multiline: 'always',
            maxEmptyLines: 1,
          },
        },
      },
    ],
    'vue/multi-word-component-names': 'off',
    'vue/no-mutating-props': 'warn',
    'vue/no-side-effects-in-computed-properties': 'warn',
    // TODO: Fix all accessibility rules
    'vuejs-accessibility/click-events-have-key-events': 'warn',
    'vuejs-accessibility/media-has-caption': 'warn',
    'vuejs-accessibility/mouse-events-have-key-events': 'warn',
    'vuejs-accessibility/click-events-have-key-events': 'warn',
    'vuejs-accessibility/no-static-element-interactions': 'off',
    // Override ForInStatement and ForOfStatement rule in airbnb config
    'no-restricted-syntax': [
      'error',
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'consistent-return': 'off',
    'no-underscore-dangle': 'off',
    'import/prefer-default-export': 'off',
    'import/no-cycle': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
      node: {
        extensions: ['.js', '.ts', '.vue'],
      },
      alias: {
        // TODO: Do I need this?
        map: [
          ['@', './src'],
          ['@components', './src/components'],
          ['@common', './src/components/common'],
          ['@icons', './src/components/common/icons'],
          ['@utils', './src/utils'],
        ],
        extensions: ['.js', '.ts', '.vue'],
      },
    },
  },
};
