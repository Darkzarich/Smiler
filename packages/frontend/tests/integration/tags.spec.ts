/* eslint-disable no-await-in-loop */

import { expect } from '@playwright/test';
import test from './page-objects';
import createRandomAuth from '@factory/auth';
import createRandomPost from '@factory/post';

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
    preRequestAction: Post.followTag.bind(Post, post._id, tagToClick),
  });

  await Post.clickTag(post._id, tagToClick);

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
    preRequestAction: Post.unfollowTag.bind(Post, post._id, tagToClick),
  });

  await Post.clickTag(post._id, tagToClick);

  await expect(Post.getFollowTagBtn()).toBeVisible();
  expect(unfollowResponse.url()).toContain(tagToClick);
  await expect(NotificationList.root).toHaveText(
    'This tag was successfully unfollowed!',
  );
});

test('Asks a visitor to sign in to follow a tag, then follows it', async ({
  SinglePostPage,
  Post,
  AuthPrompt,
  Api,
}) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });

  await SinglePostPage.goto(post.slug);

  await Post.clickTag(post._id, tagToClick);

  await expect(Post.getUnfollowTagBtn()).toBeHidden();

  await Post.getFollowTagBtn().click();

  await expect(AuthPrompt.title).toHaveText('Sign in to follow this tag');

  await Api.routes.auth.signIn.mock({
    body: createRandomAuth({ isAuth: true, tagsFollowed: [] }),
  });

  const followRequest = await Api.routes.tags.follow.waitForRequest({
    preRequestAction: AuthPrompt.signIn.bind(AuthPrompt),
  });

  expect(followRequest.url()).toContain(tagToClick);
});

test('Opens the tag menu under the tag, clear of the title', async ({
  SinglePostPage,
  Post,
}) => {
  await SinglePostPage.goto(post.slug);

  await Post.clickTag(post._id, tagToClick);
  // The enter transition slides the menu down 20px
  await expect(Post.getContextMenu()).toHaveCSS('transform', 'none');

  const tagBox = await Post.getTag(post._id, tagToClick).boundingBox();
  const titleBox = await Post.getTitleById(post._id).boundingBox();
  const menuBox = await Post.getContextMenu().boundingBox();

  expect(menuBox!.y).toBeGreaterThanOrEqual(tagBox!.y + tagBox!.height);
  expect(menuBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height);
});

test('Opens the tag menu above the tag when there is no room below', async ({
  SinglePostPage,
  Post,
  page,
}) => {
  await SinglePostPage.goto(post.slug);

  const tagBox = await Post.getTag(post._id, tagToClick).boundingBox();

  await page.setViewportSize({
    width: page.viewportSize()!.width,
    height: Math.ceil(tagBox!.y + tagBox!.height + 30),
  });

  await Post.clickTag(post._id, tagToClick);
  await expect(Post.getContextMenu()).toHaveCSS('transform', 'none');

  const menuBox = await Post.getContextMenu().boundingBox();

  expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(tagBox!.y);
  expect(menuBox!.y).toBeGreaterThanOrEqual(0);
});

test('Opens the tag menu in place, not sliding over from its last tag', async ({
  SinglePostPage,
  Post,
  page,
}) => {
  await SinglePostPage.goto(post.slug);

  await Post.clickTag(post._id, tags[0]);
  await page.mouse.click(1, 1);
  await expect(Post.getContextMenu()).toBeHidden();

  // offsetLeft/offsetTop leave out the enter transition's transform
  const positions = await Post.getTag(post._id, tags[2]).evaluate(
    (tag: HTMLElement) =>
      new Promise<string[]>((resolve) => {
        const seen = new Set<string>();
        const start = performance.now();
        const sample = () => {
          const menu = document.querySelector<HTMLElement>(
            '[data-testid="base-context-menu"]',
          );

          if (menu) {
            seen.add(`${menu.offsetLeft},${menu.offsetTop}`);
          }

          if (performance.now() - start < 300) {
            requestAnimationFrame(sample);
          } else {
            resolve([...seen]);
          }
        };

        tag.click();
        requestAnimationFrame(sample);
      }),
  );

  expect(positions).toHaveLength(1);
});

test('Moves through the tag menu with the keyboard, and Escape returns to the tag', async ({
  SinglePostPage,
  Post,
  page,
}) => {
  await SinglePostPage.goto(post.slug);

  const tag = Post.getTag(post._id, tagToClick);

  await expect(tag).toHaveAttribute('aria-haspopup', 'menu');
  await expect(tag).toHaveAttribute('aria-expanded', 'false');

  await tag.focus();
  await page.keyboard.press('Enter');

  await expect(tag).toHaveAttribute('aria-expanded', 'true');
  await expect(Post.getSearchTagBtn()).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(Post.getFollowTagBtn()).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(Post.getSearchTagBtn()).toBeFocused();

  await page.keyboard.press('Escape');

  await expect(Post.getContextMenu()).toBeHidden();
  await expect(tag).toBeFocused();
  await expect(tag).toHaveAttribute('aria-expanded', 'false');
});

test('Closes the tag menu on Tab, moving on from its tag', async ({
  SinglePostPage,
  Post,
  page,
}) => {
  await SinglePostPage.goto(post.slug);

  await Post.getTag(post._id, tagToClick).focus();
  await page.keyboard.press('Enter');
  await expect(Post.getSearchTagBtn()).toBeFocused();

  await page.keyboard.press('Tab');

  await expect(Post.getContextMenu()).toBeHidden();
  await expect(Post.getTag(post._id, tags[1])).toBeFocused();
});

test('Follows a tag from the keyboard, then returns to the tag', async ({
  SinglePostPage,
  Post,
  Api,
  page,
}) => {
  await SinglePostPage.goto(post.slug);

  const tag = Post.getTag(post._id, tagToClick);

  await tag.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(Post.getFollowTagBtn()).toBeFocused();

  const followRequest = await Api.routes.tags.follow.waitForRequest({
    preRequestAction: () => page.keyboard.press('Enter'),
  });

  expect(followRequest.url()).toContain(tagToClick);
  await expect(Post.getContextMenu()).toBeHidden();
  await expect(tag).toBeFocused();
});
