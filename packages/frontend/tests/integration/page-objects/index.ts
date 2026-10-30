import { test as base } from '@playwright/test';
import Api from './api';
import AuthForm from './components/AuthForm';
import AuthPrompt from './components/AuthPrompt';
import Comments from './components/Comments';
import CurrentUser from './components/CurrentUser';
import Menu from './components/Menu';
import NotificationList from './components/NotificationList';
import Post from './components/Post';
import PostEditor from './components/PostEditor';
import TagsList from './components/TagsList';
import ThemeToggle from './components/ThemeToggle';
import NotFoundPage from './pages/NotFoundPage';
import PostCreatePage from './pages/PostCreatePage';
import PostEditPage from './pages/PostEditPage';
import PostsPage from './pages/PostsPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import SinglePostPage from './pages/SinglePostPage';

export interface TestFixtures {
  Api: Api;
  PostsPage: PostsPage;
  SinglePostPage: SinglePostPage;
  PostEditPage: PostEditPage;
  PostCreatePage: PostCreatePage;
  SettingsPage: SettingsPage;
  ProfilePage: ProfilePage;
  SearchPage: SearchPage;
  NotFoundPage: NotFoundPage;
  Post: Post;
  Comments: Comments;
  AuthForm: AuthForm;
  AuthPrompt: AuthPrompt;
  Menu: Menu;
  PostEditor: PostEditor;
  CurrentUser: CurrentUser;
  NotificationList: NotificationList;
  TagsList: TagsList;
  ThemeToggle: ThemeToggle;
}

const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

const WIDE_WEBM = Buffer.from(
  'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAIEEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggEiTbuMU6uEHFO7a1OsggHu7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNTguNzYuMTAwV0GNTGF2ZjU4Ljc2LjEwMESJiEBZAAAAAAAAFlSua8WuAQAAAAAAADzXgQFzxYh4N/qr/xEBjpyBACK1nIN1bmSGhVZfVlA4g4EBI+ODhAX14QDgAQAAAAAAAAmwgSC6gRKagQISVMNnQJpzcwEAAAAAAAAnY8CAZ8gBAAAAAAAAGkWjh0VOQ09ERVJEh41MYXZmNTguNzYuMTAwc3MBAAAAAAAAX2PAi2PFiHg3+qv/EQGOZ8gBAAAAAAAAIkWjh0VOQ09ERVJEh5VMYXZjNTguMTM0LjEwMCBsaWJ2cHhnyKJFo4hEVVJBVElPTkSHlDAwOjAwOjAwLjEwMDAwMDAwMAAAH0O2dafngQCjooEAAIAwAgCdASogABIAAEcIhYWIhYSIAgIAB5Eo2WD+aAAcU7trkbuPs4EAt4r3gQHxggHC8IED',
  'base64',
);

// Extend base test by providing common page objects
const test = base.extend<TestFixtures>({
  Api: async ({ page, context }, use) => {
    const api = new Api(page, context);

    await api.routes.auth.csrf.mock({
      body: {
        csrfToken: 'test-csrf-token',
      },
    });

    // No API serves /uploads here, and a picture that fails to load is swapped
    // for a placeholder. Left unanswered, the request is refused at once on
    // some machines (CI) and hangs on others, so whether the <img> is still
    // there depended on the machine
    await context.route(/\/uploads\//, (route) =>
      route.fulfill({ contentType: 'image/png', body: TRANSPARENT_PIXEL }),
    );

    // Same for the video sites a post frames and the files it plays: a video
    // that fails to load is swapped for a note
    await context.route(
      /^https:\/\/([\w-]+\.)*(youtube\.com|vimeo\.com|twitch\.tv|streamable\.com|rutube\.ru|vkvideo\.ru)\//,
      (route) => route.fulfill({ contentType: 'text/html', body: '' }),
    );
    await context.route(/\.webm$/, (route) =>
      route.fulfill({ contentType: 'video/webm', body: WIDE_WEBM }),
    );

    await use(api);
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
  Post: async ({ page }, use) => {
    await use(new Post(page));
  },
  Comments: async ({ page }, use) => {
    await use(new Comments(page));
  },
  AuthForm: async ({ page }, use) => {
    await use(new AuthForm(page));
  },
  AuthPrompt: async ({ page }, use) => {
    await use(new AuthPrompt(page));
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
  ThemeToggle: async ({ page }, use) => {
    await use(new ThemeToggle(page));
  },
});

export default test;
