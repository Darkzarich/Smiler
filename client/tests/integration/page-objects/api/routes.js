// @ts-check
/* eslint-disable no-template-curly-in-string */

import Route from './route';

/** Api routes that can be awaited and\or mocked in tests
 * '*' matches any url param
 */
export default {
  posts: {
    getPosts: new Route('/posts', 'GET'),
    getFeed: new Route('/posts/feed', 'GET'),
    createPost: new Route('/posts', 'POST'),
    uploadAttachment: new Route('/posts/upload', 'POST'),
    getPostBySlug: new Route('/posts/*', 'GET'),
    updatePostById: new Route('/posts/*', 'PUT'),
    deletePostById: new Route('/posts/*', 'DELETE'),
    updateRateById: new Route('/posts/*/rate', 'PUT'),
    removeRateById: new Route('/posts/*/rate', 'DELETE'),
  },
  users: {
    getUserProfile: new Route('/users/*', 'GET'),
    checkAuthState: new Route('/users/get-auth', 'GET'),
    updateUserProfile: new Route('/users/me', 'PUT'),
    removeFilePicSection: new Route('/users/*/template/*', 'DELETE'),
    getUserTemplate: new Route('/users/*/template', 'GET'),
    updateUserTemplate: new Route('/users/*/template', 'PUT'),
    createUser: new Route('/users', 'POST'),
    authUser: new Route('/users/auth', 'POST'),
    logoutUser: new Route('/users/logout', 'POST'),
    followUser: new Route('/users/*/follow', 'PUT'),
    unfollowUser: new Route('/users/*/follow', 'DELETE'),
    getUsersFollowing: new Route('/users/me/following', 'GET'),
  },
  comments: {
    getComments: new Route('/comments', 'GET'),
    createComment: new Route('/comments', 'POST'),
    updateComment: new Route('/comments/*', 'PUT'),
    deleteComment: new Route('/comments/*', 'DELETE'),
    updateRate: new Route('/comments/*/rate', 'PUT'),
    removeRate: new Route('/comments/*/rate', 'DELETE'),
  },
  tags: {
    follow: new Route('/tags/*/follow', 'PUT'),
    unfollow: new Route('/tags/*/follow', 'DELETE'),
  },
};
