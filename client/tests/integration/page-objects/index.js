// @ts-check

import { test } from '@playwright/test';
import Api from './api';
import AuthForm from './components/AuthForm';
import CurrentUser from './components/CurrentUser';
import Menu from './components/Menu';
import Post from './components/Post';
import SystemNotification from './components/SystemNotification';
import NotFoundPage from './pages/NotFoundPage';
import PostsPage from './pages/PostsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SinglePostPage from './pages/SinglePostPage';

// Extend base test by providing common page objects
// @ts-ignore
export default test.extend({
  Api: async ({ page, context }, use) => {
    await use(new Api(page, context));
  },
  PostsPage: async ({ page }, use) => {
    await use(new PostsPage(page));
  },
  SinglePostPage: async ({ page }, use) => {
    await use(new SinglePostPage(page));
  },
  SettingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  ProfilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  NotFoundPage: async ({ page }, use) => {
    await use(new NotFoundPage(page));
  },
  Post: async ({ page, isMobile }, use) => {
    await use(new Post(page, isMobile));
  },
  AuthForm: async ({ page }, use) => {
    await use(new AuthForm(page));
  },
  Menu: async ({ page, isMobile }, use) => {
    await use(new Menu(page, isMobile));
  },
  CurrentUser: async ({ page }, use) => {
    await use(new CurrentUser(page));
  },
  SystemNotification: async ({ page }, use) => {
    await use(new SystemNotification(page));
  },
});
