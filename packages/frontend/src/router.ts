import {
  createRouter,
  createWebHistory,
  type NavigationGuard,
} from 'vue-router';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';

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
  }
}

const authGuard: NavigationGuard = async (to, from, next) => {
  const userStore = useUserStore();
  const notificationStore = useNotificationsStore();

  // TODO: Why check on each move if the user is logged in
  await userStore.userFetchAuthState();

  if (!userStore.user) {
    notificationStore.showErrorNotification({
      message: 'Only authenticated users can access this page.',
    });

    next(from);

    return;
  }

  next();
};

export const router = createRouter({
  history: createWebHistory('/'),
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash };
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
      },
    },
    {
      path: '/post/create',
      name: 'PostCreate',
      component: PostCreate,
      beforeEnter: authGuard,
      meta: {
        title: 'Make New Post',
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
