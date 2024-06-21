module.exports = {
  ignoreFiles: ['dist/**/*'],
  plugins: ['stylelint-scss', 'stylelint-order'],
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-prettier/recommended',
    'stylelint-config-two-dash-bem',
  ],
  rules: {
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    // According to Concentric CSS
    'order/properties-order': [
      [
        'display',
        'float',
        'clear',
        'flex',
        'flex-grow',
        'flex-shrink',
        'flex-basis',
        'flex-direction',
        'flex-flow',
        'flex-wrap',
        'justify-content',
        'align-items',
        'grid',
        'position',
        'top',
        'right',
        'bottom',
        'left',
        'visibility',
        'opacity',
        'z-index',
        'width',
        'min-width',
        'max-width',
        'height',
        'min-height',
        'max-height',
        'gap',
        'margin',
        'margin-top',
        'margin-right',
        'margin-bottom',
        'margin-left',
        'padding',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'outline',
        'outline-width',
        'outline-style',
        'outline-color',
        'border',
        'border-width',
        'border-style',
        'border-color',
        'border-top',
        'border-top-width',
        'border-top-style',
        'border-top-color',
        'border-right',
        'border-right-width',
        'border-right-style',
        'border-right-color',
        'border-bottom',
        'border-bottom-width',
        'border-bottom-style',
        'border-bottom-color',
        'border-left',
        'border-left-width',
        'border-left-style',
        'border-left-color',
        'border-radius',
        'border-top-left-radius',
        'border-top-right-radius',
        'border-bottom-right-radius',
        'border-bottom-left-radius',
        'box-shadow',
        'background',
        'background-image',
        'background-position',
        'background-size',
        'background-repeat',
        'background-origin',
        'background-clip',
        'background-attachment',
        'background-color',
        'color',
        'text-align',
        'text-decoration',
        'text-indent',
        'text-overflow',
        'text-transform',
        'font',
        'font-family',
        'font-size',
        'overflow',
      ],
      { unspecified: 'bottom' },
    ],
  },
};
