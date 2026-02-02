/* eslint-disable no-template-curly-in-string */

import Route, { Method } from './route';

/** Api routes that can be awaited and\or mocked in tests
 * '*' matches any url param
 */
export const routes = {
  posts: {
    getPosts: new Route('/posts', Method.GET),
    getAll: new Route('/posts/categories/all', Method.GET),
    getToday: new Route('/posts/categories/today', Method.GET),
    getBlowing: new Route('/posts/categories/blowing', Method.GET),
    getRecent: new Route('/posts/categories/recent', Method.GET),
    getTopThisWeek: new Route('/posts/categories/top-this-week', Method.GET),
    getFeed: new Route('/posts/feed', Method.GET),
    createPost: new Route('/posts', Method.POST),
    uploadAttachment: new Route('/posts/upload', Method.POST),
    getPostBySlug: new Route('/posts/*', Method.GET),
    updatePostById: new Route('/posts/*', Method.PUT),
    deletePostById: new Route('/posts/*', Method.DELETE),
    updateRateById: new Route('/posts/*/vote', Method.PUT),
    removeRateById: new Route('/posts/*/vote', Method.DELETE),
  },
  auth: {
    getAuth: new Route('/current', Method.GET),
    signIn: new Route('/signin', Method.POST),
    signUp: new Route('/signup', Method.POST),
    logout: new Route('/logout', Method.POST),
  },
  users: {
    getUserProfile: new Route('/users/*', Method.GET),
    updateUserProfile: new Route('/users/me', Method.PUT),
    removeFilePicSection: new Route('/users/me/template/*', Method.DELETE),
    getMyTemplate: new Route('/users/me/template', Method.GET),
    updateMyTemplate: new Route('/users/me/template', Method.PUT),
    followUser: new Route('/users/*/follow', Method.PUT),
    unfollowUser: new Route('/users/*/follow', Method.DELETE),
    getCurrentUserSettings: new Route('/users/me/settings', Method.GET),
  },
  comments: {
    getComments: new Route('/comments', Method.GET),
    createComment: new Route('/comments', Method.POST),
    updateComment: new Route('/comments/*', Method.PUT),
    deleteComment: new Route('/comments/*', Method.DELETE),
    updateRate: new Route('/comments/*/vote', Method.PUT),
    removeRate: new Route('/comments/*/vote', Method.DELETE),
  },
  tags: {
    follow: new Route('/tags/*/follow', Method.PUT),
    unfollow: new Route('/tags/*/follow', Method.DELETE),
  },
} as const;

export type Routes = typeof routes;
