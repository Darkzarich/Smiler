// Oxlint (.oxlintrc.json) lints all the JS/TS, including the <script> of every .vue file,
// but it cannot parse Vue templates. ESLint is kept only for those: eslint-plugin-vue and
// vuejs-accessibility on .vue files, with every rule Oxlint already covers switched off.
import { fileURLToPath } from 'node:url';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import oxlint from 'eslint-plugin-oxlint';
import pluginVue from 'eslint-plugin-vue';
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility';
import globals from 'globals';

export default [
  {
    ignores: ['src/components/common/icons/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  ...pluginVueA11y.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
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
        },
      ],
      'vue/multi-word-component-names': 'off',
      'vue/no-mutating-props': 'warn',
      'vue/no-side-effects-in-computed-properties': 'warn',
      // TODO: Fix all accessibility rules
      'vuejs-accessibility/click-events-have-key-events': 'warn',
      'vuejs-accessibility/media-has-caption': 'warn',
      'vuejs-accessibility/mouse-events-have-key-events': 'warn',
      'vuejs-accessibility/no-static-element-interactions': 'off',
      'vuejs-accessibility/label-has-for': [
        'error',
        {
          required: {
            every: ['id'],
          },
        },
      ],
    },
  },
  // Must stay last: turns off everything Oxlint reports on its own
  ...oxlint.buildFromOxlintConfigFile(
    fileURLToPath(new URL('./.oxlintrc.json', import.meta.url)),
  ),
];
