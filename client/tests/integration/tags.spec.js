/* eslint-disable no-await-in-loop */

import { expect } from '@playwright/test';
import createRandomAuth from './factory/auth';
import createRandomPost from './factory/post';
import test from './page-objects';

const tags = ['tag1', 'tag2', 'tag3'];
const post = createRandomPost({
  tags,
});
const tagToClick = tags[0];

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth({
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

test('Follows a tag', async ({
  SinglePostPage,
  Post,
  NotificationList,
  Api,
}) => {
  await SinglePostPage.goto(post.slug);

  const followResponse = await Api.routes.tags.follow.waitForRequest({
    preRequestAction: Post.followTag.bind(Post, post.id, tagToClick),
  });

  await Post.clickTag(post.id, tagToClick);

  await expect(Post.getUnfollowTagBtn()).toBeVisible();
  expect(followResponse.url()).toContain(tagToClick);
  await expect(NotificationList.root).toHaveText(
    "You're now following this tag!",
  );
});

test('Unfollows a tag', async ({
  SinglePostPage,
  Post,
  Api,
  NotificationList,
}) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth({
      isAuth: true,
      tagsFollowed: [tagToClick],
    }),
  });

  await SinglePostPage.goto(post.slug);

  const unfollowResponse = await Api.routes.tags.unfollow.waitForRequest({
    preRequestAction: Post.unfollowTag.bind(Post, post.id, tagToClick),
  });

  await Post.clickTag(post.id, tagToClick);

  await expect(Post.getFollowTagBtn()).toBeVisible();
  expect(unfollowResponse.url()).toContain(tagToClick);
  await expect(NotificationList.root).toHaveText(
    'This tag was successfully unfollowed!',
  );
});

test('Cannot follow or unfollow a tag if not logged in', async ({
  SinglePostPage,
  Post,
  Api,
}) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });

  await SinglePostPage.goto(post.slug);

  await Post.clickTag(post.id, tagToClick);

  await expect(Post.getFollowTagBtn()).toBeHidden();
  await expect(Post.getUnfollowTagBtn()).toBeHidden();
});
