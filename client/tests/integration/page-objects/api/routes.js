// @ts-check

/* eslint-disable no-template-curly-in-string */
import Route from './route';

export default {
  posts: {
    getPosts: new Route('posts', 'GET'),
    getFeed: new Route('posts/feed', 'GET'),
    createPost: new Route('posts', 'POST'),
    uploadAttachment: new Route('posts/upload', 'POST'),
    getPostBySlug: new Route('posts/${slug}', 'GET'),
    updatePostById: new Route('posts/${id}', 'PUT'),
    deletePostById: new Route('posts/${id}', 'DELETE'),
    updateRateById: new Route('posts/${id}/rate', 'PUT'),
    removeRateById: new Route('posts/${id}/rate', 'DELETE'),
  },
  users: {
    getUserProfile: new Route('users/${login}', 'GET'),
    checkAuthState: new Route('users/get-auth', 'GET'),
    updateUserProfile: new Route('users/me', 'PUT'),
    removeFilePicSection: new Route(
      'users/${login}/template/${hash}',
      'DELETE',
    ),
    getUserTemplate: new Route('users/${login}/template', 'GET'),
    updateUserTemplate: new Route('users/${login}/template', 'PUT'),
    createUser: new Route('users', 'POST'),
    authUser: new Route('users/auth', 'POST'),
    logoutUser: new Route('users/logout', 'POST'),
    followUser: new Route('users/${id}/follow', 'PUT'),
    unfollowUser: new Route('users/${id}/follow', 'DELETE'),
    getUsersFollowing: new Route('users/me/following', 'GET'),
  },
  comments: {
    getComments: new Route('comments', 'GET'),
    createComment: new Route('comments', 'POST'),
    updateComment: new Route('comments/${id}', 'PUT'),
    deleteComment: new Route('comments/${id}', 'DELETE'),
    updateRate: new Route('comments/${id}/rate', 'PUT'),
    removeRate: new Route('comments/${id}/rate', 'DELETE'),
  },
  tags: {
    follow: new Route('tags/${tag}/follow', 'PUT'),
    unfollow: new Route('tags/${tag}/follow', 'DELETE'),
  },
};
