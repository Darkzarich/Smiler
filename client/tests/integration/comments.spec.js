/* eslint-disable no-await-in-loop */
// @ts-check

import { test, expect } from '@playwright/test';
import generateAuth from './fixtures/auth';
import generateComment from './fixtures/comment';
import generatePost from './fixtures/post';

const post = generatePost();
const comment = generateComment();

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth(),
    });
  });

  await context.route(`*/**/posts/${post.slug}`, async (route) => {
    await route.fulfill({
      json: post,
    });
  });

  await context.route('*/**/comments*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        comments: [comment],
      },
    });
  });
});

test('Shows comment with its child comments', async ({ page }) => {
  await page.goto(`/${post.slug}`);

  await expect(page.getByTestId(`comment-${comment.id}-body`)).toContainText(
    comment.body,
  );
  await expect(
    page.getByTestId(`comment-${comment.children[0].id}-body`),
  ).toContainText(comment.children[0].body);
  await expect(
    page.getByTestId(`comment-${comment.children[0].children[0].id}-body`),
  ).toContainText(comment.children[0].children[0].body);
});

test('Hides children comments if root comment is collapsed', async ({
  page,
}) => {
  await page.goto(`/${post.slug}`);

  await page.getByTestId(`comment-${comment.id}-expander`).click();

  await expect(
    page.getByTestId(`comment-${comment.children[0].id}-body`),
  ).toBeHidden();
  await expect(
    page.getByTestId(`comment-${comment.children[0].children[0].id}-body`),
  ).toBeHidden();
});

test.describe('Votes', () => {
  test.beforeEach(async ({ context }) => {
    await context.route(`*/**/comments/${comment.id}/rate`, async (route) => {
      await route.fulfill({
        status: 200,
      });
    });
  });

  // TODO: Introduce page object to make it better
  const dataTestIds = {
    upvote: `comment-${comment.id}-upvote`,
    downvote: `comment-${comment.id}-downvote`,
  };

  test('Upvotes a comment', async ({ page }) => {
    await page.goto(`/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-body`).isVisible();

    const upvoteRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/comments/${comment.id}/rate`) &&
        res.method() === 'PUT',
    );

    await page.getByTestId(dataTestIds.upvote).click();

    const upvoteResponse = await upvoteRequest;

    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
    await expect(page.getByTestId(dataTestIds.upvote)).toHaveClass(
      /comments__item-main-block-meta-upvote_active/,
    );
  });

  test('Downvotes a comment', async ({ page }) => {
    await page.goto(`/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-body`).isVisible();

    const downvoteRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/comments/${comment.id}/rate`) &&
        res.method() === 'PUT',
    );

    await page.getByTestId(dataTestIds.downvote).click();

    const downvoteResponse = await downvoteRequest;

    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
    await expect(page.getByTestId(dataTestIds.downvote)).toHaveClass(
      /comments__item-main-block-meta-downvote_active/,
    );
  });

  test('Removes a vote from a comment if it was upvoted before', async ({
    page,
    context,
  }) => {
    await context.route('*/**/comments*', async (route) => {
      await route.fulfill({
        json: {
          pages: 0,
          comments: [
            generateComment({
              rated: {
                isRated: true,
                negative: false,
              },
            }),
          ],
        },
      });
    });

    await page.goto(`/${post.slug}`);

    await expect(page.getByTestId(dataTestIds.upvote)).toHaveClass(
      /comments__item-main-block-meta-upvote_active/,
    );

    const removeUpvoteRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/comments/${comment.id}/rate`) &&
        res.method() === 'DELETE',
    );

    await page.getByTestId(dataTestIds.downvote).click();

    await removeUpvoteRequest;

    await expect(page.getByTestId(dataTestIds.upvote)).not.toHaveClass(
      /comments__item-main-block-meta-upvote_active/,
    );
  });

  test('Removes a vote from a comment if it was downvoted before', async ({
    page,
    context,
  }) => {
    await context.route('*/**/comments*', async (route) => {
      await route.fulfill({
        json: {
          pages: 0,
          comments: [
            generateComment({
              rated: {
                isRated: true,
                negative: true,
              },
            }),
          ],
        },
      });
    });

    await page.goto(`/${post.slug}`);

    await expect(page.getByTestId(dataTestIds.downvote)).toHaveClass(
      /comments__item-main-block-meta-downvote_active/,
    );

    const removeDownVoteRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/comments/${comment.id}/rate`) &&
        res.method() === 'DELETE',
    );

    await page.getByTestId(dataTestIds.upvote).click();

    await removeDownVoteRequest;

    await expect(page.getByTestId(dataTestIds.downvote)).not.toHaveClass(
      /comments__item-main-block-meta-downvote_active/,
    );
  });
});
