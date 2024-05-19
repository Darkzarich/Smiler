module.exports = {
  ignoreFiles: ['dist/**/*'],
  plugins: ['stylelint-scss'],
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-prettier/recommended',
  ],
  rules: {
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    'selector-class-pattern': [
      '^[a-z][-a-z0-9]+(__[-a-z0-9]+)?(--[a-z0-9]+)?$',
      {
        message: (selector) =>
          `Selector class ${selector} violates BEM Convention`,
        resolveNestedSelectors: true,
      },
    ],
  },
};
