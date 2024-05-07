// @ts-check

import { test } from '@playwright/test';
import Api from './api';
import Menu from './components/Menu';
import PostsPage from './pages/PostsPage';

// Extend base test by providing common page objects
// @ts-ignore
export default test.extend({
  Api: async ({ page, context }, use) => {
    await use(new Api(page, context));
  },
  PostsPage: async ({ page }, use) => {
    await use(new PostsPage(page));
  },
  Menu: async ({ page, isMobile }, use) => {
    await use(new Menu(page, isMobile));
  },
});
