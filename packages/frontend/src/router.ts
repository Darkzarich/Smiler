import {
  createRouter,
  createWebHistory,
  type NavigationGuard,
  type RouteLocationNormalized,
} from 'vue-router';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useUserStore } from '@/store/user';
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

let unpinScroll = () => {};

export const router = createRouter({
  history: createWebHistory('/'),
  async scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      const el = await waitForElementById(to.hash.slice(1), 5000);

      // vue-router would apply a late result to whatever page is shown by then
      if (router.currentRoute.value.fullPath !== to.fullPath) {
        return false;
      }

      // Back and Forward return to where the reader was, not to the hash
      if (savedPosition) {
        unpinScroll = pinScroll(() => savedPosition.top, 10_000);
        return false;
      }

      if (!el) {
        return { top: 0 };
      }

      const headerHeight = () =>
        document.querySelector('.header')?.getBoundingClientRect().bottom ?? 0;

      unpinScroll = pinScroll(
        () => el.getBoundingClientRect().top + window.scrollY - headerHeight(),
        10_000,
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
      path: '/posts/blowing',
      component: PostsCategory,
      name: 'Blowing',
      meta: {
        title: 'Blowing',
      },
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
        title: 'Make New Post',
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

// A pin left running would scroll the next page after a browser Back, which
// sends no input event to the page
router.beforeEach(() => {
  unpinScroll();
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
