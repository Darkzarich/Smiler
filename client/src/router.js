import Vue from 'vue';
import Router from 'vue-router';
import store from '@/store/index';
import api from '@/api/index';

import PostsContainer from './views/PostsContainer.vue';
import NotFound from './views/NotFound.vue';
import SinglePost from './views/SinglePost.vue';
import UserPage from './views/UserPage.vue';
import PostCreate from './views/PostCreate.vue';

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
