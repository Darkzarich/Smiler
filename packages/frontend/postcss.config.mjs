import path from 'path';
import { fileURLToPath } from 'url';
import postcssGlobalData from '@csstools/postcss-global-data';
import postcssCustomMedia from 'postcss-custom-media';
import postcssNested from 'postcss-nested';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: [
    // Every file is compiled in isolation — each Vue SFC <style> block included —
    // so the shared breakpoints have to be injected rather than imported. This is
    // what removes the `@use '@/styles/mixins'` line the SCSS setup needed in
    // every component.
    postcssGlobalData({
      files: [path.resolve(dirname, 'src/styles/media.css')],
    }),
    postcssCustomMedia(),
    // Sass-flavoured nesting: unlike the CSS spec version it resolves `&__element`
    // selector concatenation, which the BEM class names here rely on.
    postcssNested(),
  ],
};
