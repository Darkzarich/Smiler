import {
  createRouter,
  createWebHistory,
  type NavigationGuard,
  type RouteLocationNormalized,
} from 'vue-router';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useUserStore } from '@/store/user';
import {
  getRestoredScrollTop,
  isHistoryTraversal,
  markPopState,
  startNavigation,
} from '@/utils/history-traversal';
import { pinScroll } from '@/utils/pin-scroll';
import { waitForElementById } from '@/utils/wait-for-element';

// Views are loaded on demand so a visitor only downloads the one they land on.
const NotFound = () => import('./views/NotFound.vue');
const PostCreate = () => import('./views/PostCreate.vue');
const PostsCategory = () => import('./views/PostsCategory.vue');
const Search = () => import('./views/Search.vue');
const SinglePost = () => import('./views/SinglePost.vue');
const UserPage = () => import('./views/UserPage.vue');
const UserSettings = () => import('./views/UserSettings.vue');

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    titleParam?: string;
    authPromptTitle?: string;
  }
}

async function openAfterSignIn(to: RouteLocationNormalized) {
  const isSignedIn = await useAuthPromptStore().open({
    title: to.meta.authPromptTitle ?? 'Sign in to continue',
  });

  if (isSignedIn) {
    await router.push(to.fullPath);
  }
}

const authGuard: NavigationGuard = async (to, from) => {
  const userStore = useUserStore();

  // TODO: Why check on each move if the user is logged in
  await userStore.userFetchAuthState();

  if (userStore.user) {
    return true;
  }

  // Not awaited: the navigation must settle while the prompt is open
  void openAfterSignIn(to);

  // A visitor who opened the link directly has no page to stay on
  return from.matched.length > 0 ? false : { name: 'Home' };
};

// Ends the wait for a hash's element and the pin after it. A browser Back sends
// the page no input event, so only the next navigation can stop them.
let hashScroll = new AbortController();

export const router = createRouter({
  history: createWebHistory('/'),
  async scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      const { signal } = hashScroll;
      const el = await waitForElementById(to.hash.slice(1), signal);

      // The reader has moved on, and vue-router would scroll the next page
      if (!el) {
        return false;
      }

      // Back and Forward return to where the reader was, not to the hash
      if (savedPosition) {
        pinScroll(() => savedPosition.top, 10_000, signal);
        return false;
      }

      const headerHeight = () =>
        document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0;

      pinScroll(
        () => el.getBoundingClientRect().top + window.scrollY - headerHeight(),
        10_000,
        signal,
      );
      return false;
    }

    if (savedPosition && isHistoryTraversal()) {
      const restoredTop = getRestoredScrollTop();

      pinScroll(
        () => restoredTop?.() ?? savedPosition.top,
        10_000,
        hashScroll.signal,
      );
      return false;
    }

    return { x: 0, top: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'Home',
      component: PostsCategory,
      meta: {
        title: 'Today',
      },
    },
    {
      path: '/posts/all',
      name: 'All',
      component: PostsCategory,
      meta: {
        filters: {
          sort: '-rating',
        },
        title: 'All Posts',
      },
    },
    {
      path: '/posts/trending',
      component: PostsCategory,
      name: 'Trending',
      meta: {
        title: 'Trending',
      },
    },
    // The category's old name, so shared links keep working
    {
      path: '/posts/blowing',
      redirect: { name: 'Trending' },
    },
    {
      path: '/posts/top-this-week',
      component: PostsCategory,
      name: 'TopThisWeek',
      meta: {
        title: 'Top This Week',
      },
    },
    {
      path: '/posts/new',
      component: PostsCategory,
      name: 'New',
      meta: {
        title: 'Recent',
      },
    },
    {
      path: '/posts/feed',
      component: PostsCategory,
      name: 'Feed',
      beforeEnter: authGuard,
      meta: {
        title: 'My Feed',
        authPromptTitle: 'Sign in to see your feed',
      },
    },
    {
      path: '/user/@:login',
      name: 'UserPage',
      component: UserPage,
      meta: {
        titleParam: 'login',
      },
    },
    {
      path: '/user/settings',
      name: 'UserSettings',
      component: UserSettings,
      beforeEnter: authGuard,
      meta: {
        title: 'Settings',
        authPromptTitle: 'Sign in to open your settings',
      },
    },
    {
      path: '/post/create',
      name: 'PostCreate',
      component: PostCreate,
      beforeEnter: authGuard,
      meta: {
        title: 'New Post',
        authPromptTitle: 'Sign in to write a post',
      },
    },
    {
      path: '/post/:slug',
      name: 'Single',
      component: SinglePost,
    },
    {
      path: '/post/:slug/edit',
      name: 'PostEdit',
      component: PostCreate,
      beforeEnter: authGuard,
      meta: {
        mode: 'edit',
        title: 'Edit Post',
        authPromptTitle: 'Sign in to edit this post',
      },
    },
    {
      path: '/posts/search',
      name: 'Search',
      component: Search,
      meta: {
        title: 'Search',
      },
    },
    {
      path: '/error/404',
      name: 'NotFound',
      component: NotFound,
      meta: {
        title: 'Not Found',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: {
        name: 'NotFound',
      },
    },
  ],
});

router.options.history.listen(markPopState);

router.beforeEach(() => {
  hashScroll.abort();
  hashScroll = new AbortController();
  startNavigation();
});

router.beforeEach((to, from, next) => {
  // Setting page title
  const ending = ' | Smiler';
  const titleTo = to.meta.title;
  const titleParams = to.meta.titleParam;

  if (titleTo) {
    window.document.title = titleTo + ending;
  } else if (titleParams) {
    window.document.title = to.params[titleParams] + ending;
  }

  next();
});
