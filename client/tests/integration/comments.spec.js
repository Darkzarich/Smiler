/* eslint-disable no-await-in-loop */
// @ts-check

import { test, expect } from '@playwright/test';
import generateAuth from './fixtures/auth';
import generateComment from './fixtures/comment';
import generatePost from './fixtures/post';
import mockDate from './utils/mock-date';

const post = generatePost();
const comment = generateComment();

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth({
        isAuth: true,
      }),
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

test('Shows a comment with its replies', async ({ page }) => {
  await page.goto(`/post/${post.slug}`);

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
  await page.goto(`/post/${post.slug}`);

  await page.getByTestId(`comment-${comment.id}-expander`).click();

  await expect(
    page.getByTestId(`comment-${comment.children[0].id}-body`),
  ).toBeHidden();
  await expect(
    page.getByTestId(`comment-${comment.children[0].children[0].id}-body`),
  ).toBeHidden();
});

test('Shows a deleted comment with different text and no reply button', async ({
  page,
  context,
}) => {
  const deletedComment = generateComment({
    children: [],
    deleted: true,
  });

  await context.route('*/**/comments*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        comments: [deletedComment],
      },
    });
  });

  await page.goto(`/post/${post.slug}`);

  await expect(page.getByTestId(`comment-${comment.id}-body`)).toContainText(
    'This comment has been deleted',
  );
  await expect(
    page.getByTestId(`comment-${comment.id}-toggle-reply`),
  ).toBeHidden();
});

test('Posts a new comment to a post', async ({ page, context }) => {
  const newCommentId = 'new-comment';
  const newCommentText = 'new comment';

  await context.route(`*/**/comments`, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        json: {
          ...route.request().postDataJSON(),
          children: [],
          id: newCommentId,
        },
      });
    }
  });

  await page.goto(`/post/${post.slug}`);

  await page.getByTestId('new-comment-form-input').fill('new comment');

  const newCommentRequest = page.waitForRequest(
    (res) => res.url().includes(`/comments`) && res.method() === 'POST',
  );

  await page.getByTestId(`new-comment-button`).click();

  const newCommentResponse = await newCommentRequest;

  expect(newCommentResponse.postDataJSON()).toEqual({
    post: post.id,
    body: newCommentText,
  });

  await expect(page.getByTestId(`comment-${newCommentId}-body`)).toContainText(
    newCommentText,
  );
});

test('Cannot post comments if not logged in', async ({ page, context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth(),
    });
  });

  await page.goto(`/post/${post.slug}`);

  await expect(page.getByTestId('new-comment-form')).toBeHidden();
});

test.describe('Replies', () => {
  const newCommentId = 'new-reply';

  test.beforeEach(async ({ context }) => {
    await context.route('*/**/users/get-auth', async (route) => {
      await route.fulfill({
        json: generateAuth({
          isAuth: true,
        }),
      });
    });

    await context.route(`*/**/comments`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          json: {
            ...route.request().postDataJSON(),
            children: [],
            id: newCommentId,
          },
        });
      }
    });
  });

  test('Replies to a comment', async ({ page }) => {
    const newCommentText = 'new comment';

    await page.goto(`/post/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-toggle-reply`).click();

    await page.getByTestId(`comment-reply-input`).fill(newCommentText);

    const replyRequest = page.waitForRequest(
      (res) => res.url().includes(`/comments`) && res.method() === 'POST',
    );

    await page.getByTestId(`comment-reply-btn`).click();

    const replyResponse = await replyRequest;

    expect(replyResponse.postDataJSON()).toEqual({
      post: post.id,
      parent: comment.id,
      body: newCommentText,
    });

    await expect(
      page.getByTestId(`comment-${newCommentId}-body`),
    ).toContainText(newCommentText);
  });

  test('Cannot reply to a comment if not logged in', async ({
    page,
    context,
  }) => {
    await context.route('*/**/users/get-auth', async (route) => {
      await route.fulfill({
        json: generateAuth(),
      });
    });

    await page.goto(`/post/${post.slug}`);

    await expect(
      page.getByTestId(`comment-${comment.id}-toggle-reply`),
    ).toBeHidden();
  });

  test('Closes the reply form', async ({ page }) => {
    await page.goto(`/post/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-toggle-reply`).click();
    await page.getByTestId(`comment-reply-close-btn`).click();

    await expect(page.getByTestId(`comment-reply-input`)).toBeHidden();
  });

  // TODO: Make it work this way

  // test('Only one reply form exists', async ({ page }) => {
  //   await page.goto(`/post/${post.slug}`);

  //   await page.getByTestId(`comment-${comment.id}-toggle-reply`).click();
  //   await page
  //     .getByTestId(`comment-${comment.children[0].id}-toggle-reply`)
  //     .click();

  //   await expect(page.getByTestId(`comment-reply-input`)).toHaveCount(1);
  // });
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
    await page.goto(`/post/${post.slug}`);

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
    await page.goto(`/post/${post.slug}`);

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

    await page.goto(`/post/${post.slug}`);

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

    await page.goto(`/post/${post.slug}`);

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

test.describe('Editing or deleting a comment', () => {
  test('Cannot edit or delete a comment if the comment is older than 10 mins', async ({
    page,
    context,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    const oldComment = generateComment({
      createdAt: new Date(
        new Date(dateToMock).getTime() - 1000 * 60 * 11, // 11 mins
      ).toISOString(),
    });

    mockDate(context, dateToMock);

    await context.route('*/**/comments*', async (route) => {
      await route.fulfill({
        json: {
          pages: 0,
          comments: [oldComment],
        },
      });
    });

    await page.goto(`/post/${post.slug}`);

    await expect(
      page.getByTestId(`comment-${oldComment.id}-edit`),
    ).toBeHidden();
    await expect(
      page.getByTestId(`comment-${oldComment.id}-delete`),
    ).toBeHidden();
  });

  test('Deletes a comment that is not older than 10 mins, sends the delete request', async ({
    page,
    context,
  }) => {
    await context.route('*/**/comments*', async (route) => {
      if (route.request().method() === 'GET') {
        const noChildrenComment = generateComment();
        noChildrenComment.children = [];

        await route.fulfill({
          json: {
            pages: 0,
            comments: [noChildrenComment],
          },
        });
      }
    });

    await context.route(`*/**/comments/${comment.id}`, async (route) => {
      await route.fulfill({
        status: 200,
      });
    });

    const dateToMock = new Date(comment.createdAt).toISOString();

    await mockDate(context, dateToMock);

    await page.goto(`/post/${post.slug}`);

    const deleteCommentRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/comments/${comment.id}`) &&
        res.method() === 'DELETE',
    );

    await page.getByTestId(`comment-${comment.id}-delete`).click();

    await deleteCommentRequest;

    await expect(page.getByTestId(`comment-${comment.id}-body`)).toBeHidden();
  });

  test('Edits a comment that is not older than 10 mins, sends the edit request', async ({
    page,
    context,
  }) => {
    const editCommentText = 'edited comment';

    await context.route(`*/**/comments/${comment.id}`, async (route) => {
      await route.fulfill({
        status: 200,
      });
    });

    const dateToMock = new Date(comment.createdAt).toISOString();

    await mockDate(context, dateToMock);

    await page.goto(`/post/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-edit`).click();
    await page.getByTestId('comment-edit-input').fill(editCommentText);

    const editCommentRequest = page.waitForRequest(
      (res) =>
        res.url().includes(`/comments/${comment.id}`) && res.method() === 'PUT',
    );

    await page.getByTestId('comment-edit-btn').click();

    const editCommentResponse = await editCommentRequest;

    expect(editCommentResponse.postDataJSON()).toEqual({
      body: editCommentText,
    });
    await expect(page.getByTestId(`comment-${comment.id}-body`)).toContainText(
      editCommentText,
    );
  });

  test('Deletes a comment that has replies', async ({ page, context }) => {
    await context.route(`*/**/comments/${comment.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
        },
      });
    });

    const dateToMock = new Date(comment.createdAt).toISOString();

    await mockDate(context, dateToMock);

    await page.goto(`/post/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-delete`).click();

    await expect(page.getByTestId(`comment-${comment.id}-body`)).toContainText(
      'This comment has been deleted',
    );
  });
});
