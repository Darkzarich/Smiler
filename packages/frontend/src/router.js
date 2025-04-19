import Vue from 'vue';
import Router from 'vue-router';
import NotFound from './views/NotFound.vue';
import PostCreate from './views/PostCreate.vue';
import PostsCategory from './views/PostsCategory.vue';
import Search from './views/Search.vue';
import SinglePost from './views/SinglePost.vue';
import UserPage from './views/UserPage.vue';
import UserSettings from './views/UserSettings.vue';
import store from '@/store/index';

Vue.use(Router);

const authGuard = async (to, from, next) => {
  // TODO: Why check on each move if the user is logged in
  await store.dispatch('userGetAuthState');

  if (!store.getters.isUserAuth) {
    store.dispatch('showErrorNotification', {
      message: 'Only authenticated users can access this page.',
    });

    next(from);

    return;
  }

  next();
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
      beforeEnter(to, from, next) {
        authGuard(to, from, next);
      },
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
      name: 'NotFound',
      component: NotFound,
      meta: {
        title: 'Not Found',
      },
    },
    {
      path: '*',
      redirect: {
        name: 'NotFound',
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
