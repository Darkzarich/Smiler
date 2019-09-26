import Vue from 'vue';
import Router from 'vue-router';

import PostsContainer from './views/PostsContainer.vue';
import NotFound from './views/NotFound.vue';
import SinglePost from './views/SinglePost.vue';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  scrollBehavior: function(to, from, savedPosition) {
    if (to.hash) {
        return {selector: to.hash}
    } else {
        return { x: 0, y: 0 }
    }
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
      path: '/:slug',
      name: 'Single',
      component: SinglePost,
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
