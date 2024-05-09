// @ts-check

import { test } from '@playwright/test';
import Api from './api';
import Menu from './components/Menu';
import SystemNotification from './components/SystemNotification';
import PostsPage from './pages/PostsPage';
import SettingsPage from './pages/SettingsPage';

// Extend base test by providing common page objects
// @ts-ignore
export default test.extend({
  Api: async ({ page, context }, use) => {
    await use(new Api(page, context));
  },
  PostsPage: async ({ page }, use) => {
    await use(new PostsPage(page));
  },
  SettingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  Menu: async ({ page, isMobile }, use) => {
    await use(new Menu(page, isMobile));
  },
  SystemNotification: async ({ page }, use) => {
    await use(new SystemNotification(page));
  },
});
