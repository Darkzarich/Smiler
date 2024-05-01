/* eslint-disable no-await-in-loop */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import generateComment from './factory/comment';
import generatePost from './factory/post';
import test from './page-objects';
import mockDate from './utils/mock-date';

const post = generatePost();
const comment = generateComment();

test.beforeEach(async ({ Api }) => {
  Api.routes.users.checkAuthState.mock({
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
      comments: [comment],
    },
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
  Api,
}) => {
  const deletedComment = generateComment({
    children: [],
    deleted: true,
  });

  Api.routes.comments.getComments.mock({
    body: {
      pages: 0,
      comments: [deletedComment],
    },
  });

  await page.goto(`/post/${post.slug}`);

  await expect(page.getByTestId(`comment-${comment.id}-body`)).toContainText(
    'This comment has been deleted',
  );
  await expect(
    page.getByTestId(`comment-${comment.id}-toggle-reply`),
  ).toBeHidden();
});

test('Posts a new comment to a post', async ({ page, Api }) => {
  const newCommentId = 'new-comment';
  const newCommentText = 'new comment';

  Api.routes.comments.createComment.mock({
    body: {
      body: newCommentText,
      children: [],
      id: newCommentId,
    },
  });

  await page.goto(`/post/${post.slug}`);

  await page.getByTestId('new-comment-form-input').fill('new comment');

  const createCommentResponse =
    await Api.routes.comments.createComment.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId(`new-comment-button`).click();
      },
    });

  expect(createCommentResponse.postDataJSON()).toEqual({
    post: post.id,
    body: newCommentText,
  });

  await expect(page.getByTestId(`comment-${newCommentId}-body`)).toContainText(
    newCommentText,
  );
});

test('Cannot post comments if not logged in', async ({ page, Api }) => {
  Api.routes.users.checkAuthState.mock({
    body: generateAuth(),
  });

  await page.goto(`/post/${post.slug}`);

  await expect(page.getByTestId('new-comment-form')).toBeHidden();
});

test.describe('Replies', () => {
  const newReplyId = 'new-reply';
  const newReplyText = 'new reply';

  test.beforeEach(async ({ Api }) => {
    Api.routes.users.checkAuthState.mock({
      body: generateAuth({
        isAuth: true,
      }),
    });

    Api.routes.comments.createComment.mock({
      body: {
        body: newReplyText,
        children: [],
        id: newReplyId,
      },
    });
  });

  test('Replies to a comment', async ({ page, Api }) => {
    await page.goto(`/post/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-toggle-reply`).click();

    await page.getByTestId(`comment-reply-input`).fill(newReplyText);

    const replyResponse =
      await Api.routes.comments.createComment.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId(`comment-reply-btn`).click();
        },
      });

    expect(replyResponse.postDataJSON()).toEqual({
      post: post.id,
      parent: comment.id,
      body: newReplyText,
    });

    await expect(page.getByTestId(`comment-${newReplyId}-body`)).toContainText(
      newReplyText,
    );
  });

  test('Cannot reply to a comment if not logged in', async ({ page, Api }) => {
    Api.routes.users.checkAuthState.mock({
      body: generateAuth(),
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
  test.beforeEach(async ({ Api }) => {
    Api.routes.comments.updateRate.mock({
      status: 200,
    });
    Api.routes.comments.removeRate.mock({
      status: 200,
    });
  });

  // TODO: Introduce page object to make it better
  const dataTestIds = {
    upvote: `comment-${comment.id}-upvote`,
    downvote: `comment-${comment.id}-downvote`,
  };

  test('Upvotes a comment', async ({ page, Api }) => {
    await page.goto(`/post/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-body`).isVisible();

    const upvoteResponse = await Api.routes.comments.updateRate.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId(dataTestIds.upvote).click();
      },
    });

    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
    await expect(page.getByTestId(dataTestIds.upvote)).toHaveClass(
      /comments__item-main-block-meta-upvote_active/,
    );
  });

  test('Downvotes a comment', async ({ page, Api }) => {
    await page.goto(`/post/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-body`).isVisible();

    const downvoteResponse =
      await Api.routes.comments.updateRate.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId(dataTestIds.downvote).click();
        },
      });

    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
    await expect(page.getByTestId(dataTestIds.downvote)).toHaveClass(
      /comments__item-main-block-meta-downvote_active/,
    );
  });

  test('Removes a vote from a comment if it was upvoted before', async ({
    page,
    Api,
  }) => {
    Api.routes.comments.getComments.mock({
      body: {
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

    await page.goto(`/post/${post.slug}`);

    await expect(page.getByTestId(dataTestIds.upvote)).toHaveClass(
      /comments__item-main-block-meta-upvote_active/,
    );

    await Api.routes.comments.removeRate.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId(dataTestIds.downvote).click();
      },
    });

    await expect(page.getByTestId(dataTestIds.upvote)).not.toHaveClass(
      /comments__item-main-block-meta-upvote_active/,
    );
  });

  test('Removes a vote from a comment if it was downvoted before', async ({
    page,
    Api,
  }) => {
    Api.routes.comments.getComments.mock({
      body: {
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

    await page.goto(`/post/${post.slug}`);

    await expect(page.getByTestId(dataTestIds.downvote)).toHaveClass(
      /comments__item-main-block-meta-downvote_active/,
    );

    await Api.routes.comments.removeRate.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId(dataTestIds.upvote).click();
      },
    });

    await expect(page.getByTestId(dataTestIds.downvote)).not.toHaveClass(
      /comments__item-main-block-meta-downvote_active/,
    );
  });
});

test.describe('Editing or deleting a comment', () => {
  test('Cannot edit or delete a comment if the comment is older than 10 mins', async ({
    page,
    context,
    Api,
  }) => {
    const dateToMock = '2024-03-06T00:00:00.000Z';

    const oldComment = generateComment({
      createdAt: new Date(
        new Date(dateToMock).getTime() - 1000 * 60 * 11, // 11 mins
      ).toISOString(),
    });

    mockDate(context, dateToMock);

    Api.routes.comments.getComments.mock({
      body: {
        pages: 0,
        comments: [oldComment],
      },
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
    Api,
  }) => {
    const noChildrenComment = generateComment();
    noChildrenComment.children = [];

    Api.routes.comments.getComments.mock({
      body: {
        pages: 0,
        comments: [noChildrenComment],
      },
    });

    Api.routes.comments.deleteComment.mock({
      status: 200,
    });

    const dateToMock = new Date(comment.createdAt).toISOString();

    await mockDate(context, dateToMock);

    await page.goto(`/post/${post.slug}`);

    await Api.routes.comments.deleteComment.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId(`comment-${comment.id}-delete`).click();
      },
    });

    await expect(page.getByTestId(`comment-${comment.id}-body`)).toBeHidden();
  });

  test('Edits a comment that is not older than 10 mins, sends the edit request', async ({
    page,
    context,
    Api,
  }) => {
    const editCommentText = 'edited comment';

    Api.routes.comments.updateComment.mock({
      status: 200,
    });

    const dateToMock = new Date(comment.createdAt).toISOString();

    await mockDate(context, dateToMock);

    await page.goto(`/post/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-edit`).click();
    await page.getByTestId('comment-edit-input').fill(editCommentText);

    const editCommentResponse =
      await Api.routes.comments.updateComment.waitForRequest({
        beforeAction: async () => {
          await page.getByTestId('comment-edit-btn').click();
        },
      });

    expect(editCommentResponse.postDataJSON()).toEqual({
      body: editCommentText,
    });
    await expect(page.getByTestId(`comment-${comment.id}-body`)).toContainText(
      editCommentText,
    );
  });

  test('Deletes a comment that has replies', async ({ page, context, Api }) => {
    Api.routes.comments.deleteComment.mock({
      status: 200,
      body: {
        success: true,
      },
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
