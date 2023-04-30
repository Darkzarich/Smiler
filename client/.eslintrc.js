module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/eslint-config-airbnb',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    indent: ['warn', 2],
    'import/extensions': 'off',
    'operator-assignment': ['error', 'never'],
    'import/no-cycle': 'warn',
    'vuejs-accessibility/click-events-have-key-events': 'warn',
    'vue/multi-word-component-names': 'warn',
    'vue/no-mutating-props': 'warn',
    'vue/no-side-effects-in-computed-properties': 'warn',
    'vuejs-accessibility/media-has-caption': 'warn',
    'vuejs-accessibility/mouse-events-have-key-events': 'warn',
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
