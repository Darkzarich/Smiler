module.exports = {
  parser: 'vue-eslint-parser',
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  plugins: ['prettier'],
  extends: [
    'plugin:import/recommended',
    // the following lines do the trick
    'plugin:import/typescript',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/recommended',
    '@vue/eslint-config-typescript/recommended',
    'plugin:vuejs-accessibility/recommended',
    'plugin:prettier/recommended',
  ],
  overrides: [
    {
      files: ['tests/**/*.js'],
      extends: ['plugin:playwright/recommended'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  ignorePatterns: ['src/components/common/icons/**'],
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
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
    'vuejs-accessibility/click-events-have-key-events': 'warn',
    'vuejs-accessibility/media-has-caption': 'warn',
    'vuejs-accessibility/mouse-events-have-key-events': 'warn',
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
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: {
        extensions: ['.js', '.ts', '.vue'],
      },
      alias: {
        map: [
          ['@', './src'],
          ['@components', './src/components'],
          ['@common', './src/components/common'],
          ['@icons', './src/components/common/icons'],
        ],
        extensions: ['.js', '.ts', '.vue'],
      },
    },
  },
};
