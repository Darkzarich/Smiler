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
      comments: [comment],
    },
  });
});

test('Shows a comment with its replies', async ({
  SinglePostPage,
  Comments,
}) => {
  await SinglePostPage.goto(post.slug);

  await expect(Comments.getCommentById(comment.id)).toContainText(comment.body);

  await expect(Comments.getCommentById(comment.children[0].id)).toContainText(
    comment.children[0].body,
  );

  await expect(
    Comments.getCommentById(comment.children[0].children[0].id),
  ).toContainText(comment.children[0].children[0].body);
});

test('Hides replies to a comments if root comment is collapsed', async ({
  SinglePostPage,
  Comments,
}) => {
  await SinglePostPage.goto(post.slug);

  await Comments.toggleRepliesExpanderById(comment.id);

  await expect(Comments.getCommentById(comment.children[0].id)).toBeHidden();
  await expect(
    Comments.getCommentById(comment.children[0].children[0].id),
  ).toBeHidden();
});

test('Shows a deleted comment with different text and no reply button', async ({
  SinglePostPage,
  Comments,
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

  await SinglePostPage.goto(post.slug);

  await expect(Comments.getCommentById(deletedComment.id)).toContainText(
    'This comment has been deleted',
  );
  await expect(Comments.getCommentReplyTogglerById(comment.id)).toBeHidden();
});

test('Posts a new comment to a post', async ({
  SinglePostPage,
  Comments,
  Api,
}) => {
  const newCommentId = 'new-comment';
  const newCommentText = 'new comment';

  Api.routes.comments.createComment.mock({
    body: {
      body: newCommentText,
      children: [],
      id: newCommentId,
    },
  });

  await SinglePostPage.goto(post.slug);

  await Comments.newCommentFormInput.fill('new comment');

  const createCommentResponse =
    await Api.routes.comments.createComment.waitForRequest({
      preRequestAction: Comments.submitNewComment.bind(Comments),
    });

  expect(createCommentResponse.postDataJSON()).toEqual({
    post: post.id,
    body: newCommentText,
  });

  await expect(Comments.getCommentById(newCommentId)).toContainText(
    newCommentText,
  );
});

test('Cannot post comments if not logged in', async ({
  SinglePostPage,
  Comments,
  Api,
}) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth(),
  });

  await SinglePostPage.goto(post.slug);

  await expect(Comments.newCommentFormEditor).toBeHidden();
  await expect(Comments.newCommentForm).toContainText(
    'Please sign in or create an account to leave a comment.',
  );
});

test.describe('Replies', () => {
  const newReplyId = 'new-reply';
  const newReplyText = 'new reply';

  test.beforeEach(async ({ Api }) => {
    Api.routes.auth.getAuth.mock({
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

  test('Replies to a comment', async ({ SinglePostPage, Comments, Api }) => {
    await SinglePostPage.goto(post.slug);

    await Comments.clickCommentReplyTogglerById(comment.id);

    await Comments.fillCommentReplyInput(newReplyText);

    const replyResponse =
      await Api.routes.comments.createComment.waitForRequest({
        preRequestAction: Comments.submitCommentReply.bind(Comments),
      });

    expect(replyResponse.postDataJSON()).toEqual({
      post: post.id,
      parent: comment.id,
      body: newReplyText,
    });

    await expect(Comments.getCommentById(newReplyId)).toContainText(
      newReplyText,
    );
  });

  test('Cannot reply to a comment if not logged in', async ({
    SinglePostPage,
    Comments,
    Api,
  }) => {
    Api.routes.auth.getAuth.mock({
      body: generateAuth(),
    });

    await SinglePostPage.goto(post.slug);

    await expect(Comments.getCommentReplyTogglerById(comment.id)).toBeHidden();
  });

  test('Closes the reply form', async ({ SinglePostPage, Comments }) => {
    await SinglePostPage.goto(post.slug);

    await Comments.clickCommentReplyTogglerById(comment.id);
    await Comments.closeCommentReplyForm();

    await expect(Comments.getCommentReplyInput()).toBeHidden();
  });

  // TODO: Make it work this way
  // test('Only one reply form exists', async ({ page }) => {
  //   await SinglePostPage.goto(post.slug);

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

  test('Upvotes a comment', async ({ SinglePostPage, Comments, Api }) => {
    await SinglePostPage.goto(post.slug);

    const upvoteResponse = await Api.routes.comments.updateRate.waitForRequest({
      preRequestAction: Comments.upvoteCommentById.bind(Comments, comment.id),
    });

    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
    await expect(await Comments.getIsCommentByIdUpvoted(comment.id)).toBe(true);
  });

  test('Downvotes a comment', async ({ SinglePostPage, Comments, Api }) => {
    await SinglePostPage.goto(post.slug);

    const downvoteResponse =
      await Api.routes.comments.updateRate.waitForRequest({
        preRequestAction: Comments.downvoteCommentById.bind(
          Comments,
          comment.id,
        ),
      });

    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
    await expect(await Comments.getIsCommentByIdDownvoted(comment.id)).toBe(
      true,
    );
  });

  test('Removes a vote from a comment if it was upvoted before', async ({
    SinglePostPage,
    Comments,
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

    await SinglePostPage.goto(post.slug);

    await expect(await Comments.getIsCommentByIdUpvoted(comment.id)).toBe(true);

    await Api.routes.comments.removeRate.waitForRequest({
      preRequestAction: Comments.downvoteCommentById.bind(Comments, comment.id),
    });

    await expect(await Comments.getIsCommentByIdUpvoted(comment.id)).toBe(
      false,
    );
  });

  test('Removes a vote from a comment if it was downvoted before', async ({
    SinglePostPage,
    Comments,
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

    await SinglePostPage.goto(post.slug);

    await expect(await Comments.getIsCommentByIdDownvoted(comment.id)).toBe(
      true,
    );

    await Api.routes.comments.removeRate.waitForRequest({
      preRequestAction: Comments.upvoteCommentById.bind(Comments, comment.id),
    });

    await expect(await Comments.getIsCommentByIdDownvoted(comment.id)).toBe(
      false,
    );
  });
});

test.describe('Editing or deleting a comment', () => {
  test('Cannot edit or delete a comment if the comment is older than 10 mins', async ({
    SinglePostPage,
    Comments,
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

    await SinglePostPage.goto(post.slug);

    await expect(Comments.getEditBtnById(oldComment.id)).toBeHidden();
    await expect(Comments.getDeleteBtnById(oldComment.id)).toBeHidden();
  });

  test('Deletes a comment that is not older than 10 mins, sends the delete request', async ({
    SinglePostPage,
    Comments,
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

    await SinglePostPage.goto(post.slug);

    await Api.routes.comments.deleteComment.waitForRequest({
      preRequestAction: Comments.deleteCommentById.bind(Comments, comment.id),
    });

    await expect(Comments.getCommentById(comment.id)).toBeHidden();
  });

  test('Edits a comment that is not older than 10 mins, sends the edit request', async ({
    SinglePostPage,
    Comments,
    context,
    Api,
  }) => {
    const editCommentText = 'edited comment';

    Api.routes.comments.updateComment.mock({
      status: 200,
    });

    const dateToMock = new Date(comment.createdAt).toISOString();

    await mockDate(context, dateToMock);

    await SinglePostPage.goto(post.slug);

    await Comments.toggleCommentEditById(comment.id);
    await Comments.getCommentEditInput().fill(editCommentText);

    const editCommentResponse =
      await Api.routes.comments.updateComment.waitForRequest({
        preRequestAction: Comments.submitEditedComment.bind(
          Comments,
          comment.id,
        ),
      });

    expect(editCommentResponse.postDataJSON()).toEqual({
      body: editCommentText,
    });
    await expect(Comments.getCommentById(comment.id)).toContainText(
      editCommentText,
    );
  });

  test('Deletes a comment that has replies', async ({
    SinglePostPage,
    Comments,
    context,
    Api,
  }) => {
    Api.routes.comments.deleteComment.mock({
      status: 200,
      body: {
        success: true,
      },
    });

    const dateToMock = new Date(comment.createdAt).toISOString();

    await mockDate(context, dateToMock);

    await SinglePostPage.goto(post.slug);

    await Comments.deleteCommentById(comment.id);

    await expect(Comments.getCommentById(comment.id)).toContainText(
      'This comment has been deleted',
    );
  });
});
