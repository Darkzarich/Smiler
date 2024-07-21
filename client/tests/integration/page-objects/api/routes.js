// @ts-check
/* eslint-disable no-template-curly-in-string */

import Route from './route';

/** Api routes that can be awaited and\or mocked in tests
 * '*' matches any url param
 */
export default {
  posts: {
    getPosts: new Route('/posts', 'GET'),
    getAll: new Route('/posts/categories/all', 'GET'),
    getToday: new Route('/posts/categories/today', 'GET'),
    getBlowing: new Route('/posts/categories/blowing', 'GET'),
    getRecent: new Route('/posts/categories/recent', 'GET'),
    getTopThisWeek: new Route('/posts/categories/top-this-week', 'GET'),
    getFeed: new Route('/posts/feed', 'GET'),
    createPost: new Route('/posts', 'POST'),
    uploadAttachment: new Route('/posts/upload', 'POST'),
    getPostBySlug: new Route('/posts/*', 'GET'),
    updatePostById: new Route('/posts/*', 'PUT'),
    deletePostById: new Route('/posts/*', 'DELETE'),
    updateRateById: new Route('/posts/*/vote', 'PUT'),
    removeRateById: new Route('/posts/*/vote', 'DELETE'),
  },
  auth: {
    getAuth: new Route('/current', 'GET'),
    signIn: new Route('/signin', 'POST'),
    signUp: new Route('/signup', 'POST'),
    logout: new Route('/logout', 'POST'),
  },
  users: {
    getUserProfile: new Route('/users/*', 'GET'),
    updateUserProfile: new Route('/users/me', 'PUT'),
    removeFilePicSection: new Route('/users/*/template/*', 'DELETE'),
    getUserTemplate: new Route('/users/*/template', 'GET'),
    updateUserTemplate: new Route('/users/*/template', 'PUT'),
    followUser: new Route('/users/*/follow', 'PUT'),
    unfollowUser: new Route('/users/*/follow', 'DELETE'),
    getUserSettings: new Route('/users/me/settings', 'GET'),
  },
  comments: {
    getComments: new Route('/comments', 'GET'),
    createComment: new Route('/comments', 'POST'),
    updateComment: new Route('/comments/*', 'PUT'),
    deleteComment: new Route('/comments/*', 'DELETE'),
    updateRate: new Route('/comments/*/vote', 'PUT'),
    removeRate: new Route('/comments/*/vote', 'DELETE'),
  },
  tags: {
    follow: new Route('/tags/*/follow', 'PUT'),
    unfollow: new Route('/tags/*/follow', 'DELETE'),
  },
};
