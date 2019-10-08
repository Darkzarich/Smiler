import Vue from 'vue';
import Router from 'vue-router';
import store from '@/store/index';
import api from '@/api/index';

import PostsContainer from './views/PostsContainer.vue';
import NotFound from './views/NotFound.vue';
import SinglePost from './views/SinglePost.vue';
import UserPage from './views/UserPage.vue';
import PostCreate from './views/PostCreate.vue';
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
        message: 'Only authenticated users can acces this page.',
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
      },
    },
    {
      path: '/posts/feed',
      component: PostsContainer,
      name: 'Feed',
    },
    {
      path: '/error/404',
      name: '404',
      component: NotFound,
    },
    {
      path: '/user/@:login',
      name: 'UserPage',
      component: UserPage,
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
      },
    },
    {
      path: '/posts/search',
      name: 'Search',
      component: Search,
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (about.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import(/* webpackChunkName: "about" */ './views/About.vue'),
    // },
  ],
});

router.beforeEach((to, from, next) => {
  const mathed = router.options.routes.find(el => el.name === to.name);

  if (mathed) {
    next();
  } else {
    next({
      name: '404',
    });
  }
});

export default router;
