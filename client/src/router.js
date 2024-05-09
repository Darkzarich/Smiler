import Vue from 'vue';
import Router from 'vue-router';
import NotFound from './views/NotFound.vue';
import PostCreate from './views/PostCreate.vue';
import PostsContainer from './views/PostsContainer.vue';
import Search from './views/Search.vue';
import SinglePost from './views/SinglePost.vue';
import UserPage from './views/UserPage.vue';
import UserSettings from './views/UserSettings.vue';
import store from '@/store/index';

Vue.use(Router);

const authGuard = async (to, from, next) => {
  await store.dispatch('userGetAuthState');

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

const getFilterDate = ({ h = 0, m = 0, s = 0, ms = 0, d = undefined } = {}) => {
  // TODO: Change to date-fns

  const date = new Date();

  date.setHours(h);
  date.setMinutes(m);
  date.setSeconds(s);
  date.setMilliseconds(ms);

  if (d) {
    date.setDate(d);
  }

  return date.toISOString();
};

const router = new Router({
  mode: 'history',
  base: '/',
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
        // TODO: Filters have constant values, as the time goes it doesn't change
        filters: {
          sort: '-rating',
          dateFrom: getFilterDate(),
          dateTo: getFilterDate({
            h: 23,
            m: 59,
            s: 59,
            ms: 999,
          }),
        },
        title: 'Today',
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
          dateFrom: getFilterDate({
            h: new Date().getHours() - 2,
            ms: 0,
          }),
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
          dateFrom: getFilterDate({
            h: 0,
            m: 0,
            s: 0,
            ms: 0,
            d: new Date().getDate() - new Date().getDay(),
          }),
          dateTo: getFilterDate({
            ms: 999,
          }),
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
          dateFrom: getFilterDate({
            h: new Date().getHours() - 2,
            m: new Date().getMinutes(),
            ms: 0,
          }),
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
      path: '/post/:slug',
      name: 'Single',
      component: SinglePost,
    },
    {
      path: '/post/:slug/edit',
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
      path: '/error/404',
      name: '404',
      component: NotFound,
      meta: {
        title: '404 Not Found',
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

export default router;
