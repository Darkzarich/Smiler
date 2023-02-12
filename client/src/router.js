import Vue from 'vue';
import Router from 'vue-router';
import store from '@/store/index';

import PostsContainer from './views/PostsContainer.vue';
import NotFound from './views/NotFound.vue';
import SinglePost from './views/SinglePost.vue';
import UserPage from './views/UserPage.vue';
import PostCreate from './views/PostCreate.vue';
import UserSettings from './views/UserSettings.vue';
import Search from './views/Search.vue';

Vue.use(Router);

const authGuard = async (to, from, next) => {
  await store.dispatch('userCheckAuthState');

  if (store.getters.getUserAuthState) {
    next();
  } else {
    console.log(store.getters.getUserAuthState);
    store.dispatch('newSystemNotification', {
      error: {
        message: 'Only authenticated users can access this page.',
      },
    });
    next(from);
  }
};

const getFilterDate = (h, m, s, d) => {
  const date = new Date();
  date.setHours(h || 0);
  date.setMinutes(m || 0);
  date.setSeconds(s || 0);

  if (d) {
    date.setDate(d);
  }

  return date.toISOString();
};

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  scrollBehavior(to) {
    if (to.hash) {
      return { selector: to.hash };
    }
    return { x: 0, y: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'Home',
      component: PostsContainer,
      meta: {
        filters: {
          sort: '-rating',
          dateFrom: getFilterDate(),
          dateTo: getFilterDate(23, 59, 59),
        },
        title: 'Home',
      },
    },
    {
      path: '/posts/all',
      name: 'All',
      component: PostsContainer,
      meta: {
        filters: {
          sort: '-rating',
        },
        title: 'All Posts',
      },
    },
    {
      path: '/posts/blowing',
      component: PostsContainer,
      name: 'Blowing',
      meta: {
        filters: {
          sort: '-rating',
          ratingFrom: 50,
          dateFrom: getFilterDate(new Date().getHours - 2),
          dateTo: new Date().toISOString(),
        },
        title: 'Blowing',
      },
    },
    {
      path: '/posts/top-this-week',
      component: PostsContainer,
      name: 'TopThisWeek',
      meta: {
        filters: {
          sort: '-createdAt',
          dateFrom: getFilterDate(0, 0, 0, new Date().getDate() - new Date().getDay()),
          dateTo: new Date().toISOString(),
        },
        title: 'Top This Week',
      },
    },
    {
      path: '/posts/new',
      component: PostsContainer,
      name: 'New',
      meta: {
        filters: {
          sort: '-createdAt',
          dateFrom: getFilterDate(new Date().getHours() - 2, new Date().getMinutes()),
        },
        title: 'Recent',
      },
    },
    {
      path: '/posts/feed',
      component: PostsContainer,
      name: 'Feed',
      beforeEnter(to, from, next) {
        authGuard(to, from, next);
      },
      meta: {
        title: 'Feed',
      },
    },
    {
      path: '/error/404',
      name: '404',
      component: NotFound,
      meta: {
        title: '404',
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
      beforeEnter(to, from, next) {
        authGuard(to, from, next);
      },
      meta: {
        title: 'Settings',
      },
    },
    {
      path: '/:slug',
      name: 'Single',
      component: SinglePost,
    },
    {
      path: '/post/create',
      name: 'PostCreate',
      component: PostCreate,
      beforeEnter(to, from, next) {
        authGuard(to, from, next);
      },
      meta: {
        title: 'Create New Post',
      },
    },
    {
      path: '/:slug/edit',
      name: 'PostEdit',
      component: PostCreate,
      beforeEnter(to, from, next) {
        authGuard(to, from, next);
      },
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
      path: '*',
      redirect: {
        name: '404',
      },
    },
  ],
});

router.beforeEach((to, from, next) => {
  // set title
  const titleTo = to.meta.title;
  const titleParams = to.meta.titleParam;

  if (titleTo) {
    window.document.title = titleTo;
  } else if (titleParams) {
    window.document.title = to.params[titleParams];
  }

  next();
});

export default router;
