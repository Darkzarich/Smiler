module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended',
    '@vue/eslint-config-airbnb',
  ],
  rules: {
    indent: ['warn', 2],
    'brace-style': ['error'],
    'comma-dangle': [
      'error',
      {
        imports: 'always-multiline',
        exports: 'always-multiline',
        objects: 'always-multiline',
        arrays: 'always-multiline',
        functions: 'ignore',
      },
    ],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-new': 'error',
    'no-var': 'error',
    curly: 'warn',
    'operator-assignment': ['error', 'never'],
    'import/order': ['error', { alphabetize: { order: 'asc' }, 'newlines-between': 'never' }],
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
    'vue/max-attributes-per-line': ['error', { singleline: 3, multiline: 1 }],
    'vuejs-accessibility/click-events-have-key-events': 'warn',
    'vuejs-accessibility/media-has-caption': 'warn',
    'vuejs-accessibility/mouse-events-have-key-events': 'warn',
    // Override ForInStatement and ForOfStatement rule in airbnb config
    'no-restricted-syntax': [
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
  },
  parser: 'vue-eslint-parser',
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.vue'],
      },
      alias: {
        map: [
          ['@', './src'],
        ],
        extensions: ['.js', '.vue'],
      },
    },
  },
};
