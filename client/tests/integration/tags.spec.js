/* eslint-disable no-await-in-loop */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generatePost from './factory/post';
import test from './page-objects';

const tags = ['tag1', 'tag2', 'tag3'];
const post = generatePost({
  tags,
});
const tagToClick = tags[0];

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth({
      isAuth: true,
    }),
  });

  Api.routes.posts.getPostBySlug.mock({
    body: post,
  });

  Api.routes.comments.getComments.mock({
    body: {
      pages: 0,
      comments: [],
    },
  });

  Api.routes.tags.follow.mock({
    body: {
      ok: true,
    },
  });

  Api.routes.tags.unfollow.mock({
    body: {
      ok: true,
    },
  });
});

test('Follows a tag', async ({ SinglePostPage, Post, Api }) => {
  await SinglePostPage.goto(post.slug);

  const followResponse = await Api.routes.tags.follow.waitForRequest({
    beforeAction: Post.followTag.bind(Post, post.id, tagToClick),
  });

  await Post.clickTag(post.id, tagToClick);

  await expect(Post.getUnfollowTagBtn()).toBeVisible();
  expect(followResponse.url()).toContain(tagToClick);
});

test('Unfollows a tag', async ({ SinglePostPage, Post, Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth({
      isAuth: true,
      tagsFollowed: [tagToClick],
    }),
  });

  await SinglePostPage.goto(post.slug);

  const unfollowResponse = await Api.routes.tags.unfollow.waitForRequest({
    beforeAction: Post.unfollowTag.bind(Post, post.id, tagToClick),
  });

  await Post.clickTag(post.id, tagToClick);

  await expect(Post.getFollowTagBtn()).toBeVisible();
  expect(unfollowResponse.url()).toContain(tagToClick);
});

test('Cannot follow or unfollow a tag if not logged in', async ({
  SinglePostPage,
  Post,
  Api,
}) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth(),
  });

  await SinglePostPage.goto(post.slug);

  await Post.clickTag(post.id, tagToClick);

  await expect(Post.getFollowTagBtn()).toBeHidden();
  await expect(Post.getUnfollowTagBtn()).toBeHidden();
});
