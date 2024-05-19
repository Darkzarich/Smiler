// @ts-check

import { test } from '@playwright/test';
import Api from './api';
import AuthForm from './components/AuthForm';
import Comments from './components/Comments';
import CurrentUser from './components/CurrentUser';
import Menu from './components/Menu';
import NotificationList from './components/NotificationList';
import Post from './components/Post';
import PostEditor from './components/PostEditor';
import TagsList from './components/TagsList';
import NotFoundPage from './pages/NotFoundPage';
import PostCreatePage from './pages/PostCreatePage';
import PostEditPage from './pages/PostEditPage';
import PostsPage from './pages/PostsPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import SinglePostPage from './pages/SinglePostPage';

// Extend base test by providing common page objects
// @ts-ignore
export default test.extend({
  Api: async ({ page, context }, use) => {
    await use(new Api(page, context));
  },
  PostsPage: async ({ page, isMobile }, use) => {
    await use(new PostsPage(page, isMobile));
  },
  SinglePostPage: async ({ page }, use) => {
    await use(new SinglePostPage(page));
  },
  PostEditPage: async ({ page }, use) => {
    await use(new PostEditPage(page));
  },
  PostCreatePage: async ({ page }, use) => {
    await use(new PostCreatePage(page));
  },
  SettingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page));
  },
  ProfilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  SearchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  NotFoundPage: async ({ page }, use) => {
    await use(new NotFoundPage(page));
  },
  Post: async ({ page, isMobile }, use) => {
    await use(new Post(page, isMobile));
  },
  Comments: async ({ page }, use) => {
    await use(new Comments(page));
  },
  AuthForm: async ({ page }, use) => {
    await use(new AuthForm(page));
  },
  Menu: async ({ page, isMobile }, use) => {
    await use(new Menu(page, isMobile));
  },
  PostEditor: async ({ page }, use) => {
    await use(new PostEditor(page));
  },
  CurrentUser: async ({ page }, use) => {
    await use(new CurrentUser(page));
  },
  NotificationList: async ({ page }, use) => {
    await use(new NotificationList(page));
  },
  TagsList: async ({ page }, use) => {
    await use(new TagsList(page));
  },
});
