/* eslint-disable no-await-in-loop */
import { expect } from '@playwright/test';
import { subMinutes } from 'date-fns';
import test from './page-objects';
import mockDate from './utils/mock-date';
import createRandomAuth from '@factory/auth';
import createRandomComment from '@factory/comment';
import createRandomPost from '@factory/post';

const auth = createRandomAuth({
  isAuth: true,
});
const post = createRandomPost();
const comment = createRandomComment({}, true);
const asParagraph = (text: string) => `<p>${text}</p>`;

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: auth,
  });

  Api.routes.posts.getPostBySlug.mock({
    body: post,
  });

  Api.routes.comments.getComments.mock({
    body: {
      pages: 1,
      comments: [comment],
      hasNextPage: false,
      total: 1,
    },
  });
});

test('Shows a comment with its replies', async ({
  SinglePostPage,
  Comments,
}) => {
  await SinglePostPage.goto(post.slug);

  await expect(Comments.getCommentById(comment._id)).toContainText(
    comment.body,
  );

  await expect(Comments.getCommentById(comment.children[0]._id)).toContainText(
    comment.children[0].body,
  );

  await expect(
    Comments.getCommentById(comment.children[0].children[0]._id),
  ).toContainText(comment.children[0].children[0].body);
});

test('Hides replies to a comments if root comment is collapsed', async ({
  SinglePostPage,
  Comments,
}) => {
  await SinglePostPage.goto(post.slug);

  await Comments.toggleRepliesExpanderById(comment._id);

  await expect(Comments.getCommentById(comment.children[0]._id)).toBeHidden();
  await expect(
    Comments.getCommentById(comment.children[0].children[0]._id),
  ).toBeHidden();
});

test('Shows a deleted comment with different text and no reply button', async ({
  SinglePostPage,
  Comments,
  Api,
}) => {
  const deletedComment = createRandomComment({
    deleted: true,
  });

  Api.routes.comments.getComments.mock({
    body: {
      pages: 1,
      comments: [deletedComment],
      hasNextPage: false,
      total: 1,
    },
  });

  await SinglePostPage.goto(post.slug);

  await expect(Comments.getCommentById(deletedComment._id)).toContainText(
    'This comment has been deleted',
  );
  await expect(Comments.getCommentReplyTogglerById(comment._id)).toBeHidden();
});

test('Posts a new comment to a post', async ({
  SinglePostPage,
  Comments,
  Api,
}) => {
  const newComment = createRandomComment();

  Api.routes.comments.createComment.mock({
    body: newComment,
  });

  await SinglePostPage.goto(post.slug);

  await Comments.newCommentFormInput.fill('new comment');

  const createCommentResponse =
    await Api.routes.comments.createComment.waitForRequest({
      preRequestAction: Comments.submitNewComment.bind(Comments),
    });

  expect(createCommentResponse.postDataJSON()).toEqual({
    post: post._id,
    body: asParagraph('new comment'),
  });

  await expect(Comments.getCommentById(newComment._id)).toContainText(
    newComment.body,
  );
});

test('Cannot post comments if not logged in', async ({
  SinglePostPage,
  Comments,
  Api,
}) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
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
      body: createRandomAuth({
        isAuth: true,
      }),
    });

    Api.routes.comments.createComment.mock({
      body: {
        body: newReplyText,
        children: [],
        _id: newReplyId,
      },
    });
  });

  test('Replies to a comment', async ({ SinglePostPage, Comments, Api }) => {
    await SinglePostPage.goto(post.slug);

    await Comments.clickCommentReplyTogglerById(comment._id);

    await Comments.fillCommentReplyInput(newReplyText);

    const replyResponse =
      await Api.routes.comments.createComment.waitForRequest({
        preRequestAction: Comments.submitCommentReply.bind(Comments),
      });

    expect(replyResponse.postDataJSON()).toEqual({
      post: post._id,
      parent: comment._id,
      body: asParagraph(newReplyText),
    });

    await expect(Comments.getCommentById(newReplyId)).toContainText(
      newReplyText,
    );
  });

  test('Cannot reply to a comment if not logged in', async ({
    NotificationList,
    SinglePostPage,
    Comments,
    Api,
  }) => {
    Api.routes.auth.getAuth.mock({
      body: createRandomAuth(),
    });

    await SinglePostPage.goto(post.slug);

    await Comments.clickCommentReplyTogglerById(comment._id);

    await expect(NotificationList.root).toHaveText(
      'Please sign in or create an account to leave a reply.',
    );
    await expect(Comments.getCommentReplyInput()).toBeHidden();
  });

  test('Closes the reply form', async ({ SinglePostPage, Comments }) => {
    await SinglePostPage.goto(post.slug);

    await Comments.clickCommentReplyTogglerById(comment._id);
    await Comments.closeCommentReplyForm();

    await expect(Comments.getCommentReplyInput()).toBeHidden();
  });

  // TODO: Make it work this way
  // test('Only one reply form exists', async ({ page }) => {
  //   await SinglePostPage.goto(post.slug);

  //   await page.getByTestId(`comment-${comment._id}-toggle-reply`).click();
  //   await page
  //     .getByTestId(`comment-${comment.children[0]._id}-toggle-reply`)
  //     .click();

  //   await expect(page.getByTestId(`comment-reply-input`)).toHaveCount(1);
  // });
});

test.describe('Votes', () => {
  const notRatedComment = createRandomComment({
    rated: { isRated: false, negative: false },
  });

  test.beforeEach(async ({ Api }) => {
    Api.routes.comments.getComments.mock({
      body: {
        pages: 1,
        comments: [notRatedComment],
        hasNextPage: false,
        total: 1,
      },
    });
  });

  test('Upvotes a comment', async ({ SinglePostPage, Comments, Api }) => {
    Api.routes.comments.updateRate.mock({
      status: 200,
      body: {
        ...notRatedComment,
        // Increases more than the default rate to test using the response data
        rating: notRatedComment.rating + 2,
        rated: {
          isRated: true,
          negative: false,
        },
      },
    });

    await SinglePostPage.goto(post.slug);

    const upvoteResponse = await Api.routes.comments.updateRate.waitForRequest({
      preRequestAction: Comments.upvoteCommentById.bind(
        Comments,
        notRatedComment._id,
      ),
    });

    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });

    expect(await Comments.getIsCommentByIdUpvoted(notRatedComment._id)).toBe(
      true,
    );

    await expect(
      Comments.getCommentRatingById(notRatedComment._id),
    ).toContainText(String(notRatedComment.rating + 2));
  });

  test('Downvotes a comment', async ({ SinglePostPage, Comments, Api }) => {
    Api.routes.comments.updateRate.mock({
      status: 200,
      body: {
        ...notRatedComment,
        // Decreases more than the default rate to test using the response data
        rating: notRatedComment.rating - 10,
        rated: {
          isRated: true,
          negative: true,
        },
      },
    });

    await SinglePostPage.goto(post.slug);

    const downvoteResponse =
      await Api.routes.comments.updateRate.waitForRequest({
        preRequestAction: Comments.downvoteCommentById.bind(
          Comments,
          notRatedComment._id,
        ),
      });

    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });

    expect(await Comments.getIsCommentByIdDownvoted(notRatedComment._id)).toBe(
      true,
    );

    await expect(
      Comments.getCommentRatingById(notRatedComment._id),
    ).toContainText(String(notRatedComment.rating - 10));
  });

  test('Overrides a downvote with an upvote', async ({
    SinglePostPage,
    Comments,
    Api,
  }) => {
    Api.routes.comments.getComments.mock({
      body: {
        pages: 1,
        comments: [
          {
            ...comment,
            rated: {
              isRated: true,
              negative: true,
            },
          },
        ],
        hasNextPage: false,
        total: 1,
      },
    });

    Api.routes.comments.updateRate.mock({
      status: 200,
      body: {
        ...comment,
        // Increases more than the default rate to test using the response data
        rating: comment.rating + 10,
        rated: {
          isRated: true,
          negative: false,
        },
      },
    });

    await SinglePostPage.goto(post.slug);

    const upvoteResponse = await Api.routes.comments.updateRate.waitForRequest({
      preRequestAction: Comments.upvoteCommentById.bind(Comments, comment._id),
    });

    expect(upvoteResponse.url()).toContain(comment._id);
    expect(upvoteResponse.postDataJSON()).toEqual({
      negative: false,
    });
    expect(await Comments.getIsCommentByIdUpvoted(comment._id)).toBe(true);
    await expect(Comments.getCommentRatingById(comment._id)).toContainText(
      String(comment.rating + 10),
    );
  });

  test('Overrides an upvote with a downvote', async ({
    SinglePostPage,
    Comments,
    Api,
  }) => {
    Api.routes.comments.getComments.mock({
      body: {
        pages: 1,
        hasNextPage: false,
        total: 1,
        comments: [
          {
            ...comment,
            rated: {
              isRated: true,
              negative: false,
            },
          },
        ],
      },
    });

    Api.routes.comments.updateRate.mock({
      status: 200,
      body: {
        ...comment,
        // Increases more than the default rate to test using the response data
        rating: comment.rating + 10,
        rated: {
          isRated: true,
          negative: true,
        },
      },
    });

    await SinglePostPage.goto(post.slug);

    const downvoteResponse =
      await Api.routes.comments.updateRate.waitForRequest({
        preRequestAction: Comments.downvoteCommentById.bind(
          Comments,
          comment._id,
        ),
      });

    expect(downvoteResponse.url()).toContain(comment._id);
    expect(downvoteResponse.postDataJSON()).toEqual({
      negative: true,
    });
    expect(await Comments.getIsCommentByIdDownvoted(comment._id)).toBe(true);
    await expect(Comments.getCommentRatingById(comment._id)).toContainText(
      String(comment.rating + 10),
    );
  });

  test('Removes a vote from a comment if it was upvoted before', async ({
    SinglePostPage,
    Comments,
    Api,
  }) => {
    const ratedComment = createRandomComment({
      rated: {
        isRated: true,
        negative: false,
      },
    });

    Api.routes.comments.getComments.mock({
      body: {
        pages: 1,
        comments: [ratedComment],
        hasNextPage: false,
        total: 1,
      },
    });

    Api.routes.comments.removeRate.mock({
      status: 200,
      body: {
        ...ratedComment,
        // Decreases more than the default rate to test using the response data
        rating: ratedComment.rating - 10,
        rated: {
          isRated: false,
          negative: false,
        },
      },
    });

    await SinglePostPage.goto(post.slug);

    expect(await Comments.getIsCommentByIdUpvoted(ratedComment._id)).toBe(true);

    const removeUpvoteResponse =
      await Api.routes.comments.removeRate.waitForRequest({
        preRequestAction: Comments.upvoteCommentById.bind(
          Comments,
          ratedComment._id,
        ),
      });

    expect(removeUpvoteResponse.url()).toContain(ratedComment._id);
    expect(await Comments.getIsCommentByIdUpvoted(ratedComment._id)).toBe(
      false,
    );
    await expect(Comments.getCommentRatingById(ratedComment._id)).toContainText(
      String(ratedComment.rating - 10),
    );
  });

  test('Removes a vote from a comment if it was downvoted before', async ({
    SinglePostPage,
    Comments,
    Api,
  }) => {
    const downvotedComment = createRandomComment({
      rated: {
        isRated: true,
        negative: true,
      },
    });

    Api.routes.comments.getComments.mock({
      body: {
        pages: 1,
        comments: [downvotedComment],
        hasNextPage: false,
        total: 1,
      },
    });

    Api.routes.comments.removeRate.mock({
      status: 200,
      body: {
        ...downvotedComment,
        // Decreases more than the default rate to test using the response data
        rating: downvotedComment.rating + 10,
        rated: {
          isRated: false,
          negative: false,
        },
      },
    });

    await SinglePostPage.goto(post.slug);

    expect(await Comments.getIsCommentByIdDownvoted(downvotedComment._id)).toBe(
      true,
    );

    const removeDownvoteResponse =
      await Api.routes.comments.removeRate.waitForRequest({
        preRequestAction: Comments.downvoteCommentById.bind(
          Comments,
          downvotedComment._id,
        ),
      });

    expect(removeDownvoteResponse.url()).toContain(downvotedComment._id);
    expect(await Comments.getIsCommentByIdUpvoted(downvotedComment._id)).toBe(
      false,
    );
    await expect(
      Comments.getCommentRatingById(downvotedComment._id),
    ).toContainText(String(downvotedComment.rating + 10));
  });
});

test.describe('Editing or deleting a comment', () => {
  const currentUserComment = createRandomComment(
    {
      author: {
        _id: auth._id,
      },
    },
    false,
  );

  test.beforeEach(({ Api }) => {
    Api.routes.comments.getComments.mock({
      body: {
        pages: 1,
        comments: [currentUserComment],
        hasNextPage: false,
        total: 1,
      },
    });
  });

  test('The current user cannot edit or delete their comment if the comment is older than 10 mins', async ({
    SinglePostPage,
    Comments,
    context,
    Api,
  }) => {
    const nowISOString = new Date().toISOString();

    const oldComment = createRandomComment({
      // Posted 11 minutes ago from now
      createdAt: subMinutes(nowISOString, 11).toISOString(),
      author: {
        _id: auth._id,
      },
    });

    mockDate(context, nowISOString);

    Api.routes.comments.getComments.mock({
      body: {
        pages: 1,
        comments: [oldComment],
        hasNextPage: false,
        total: 1,
      },
    });

    await SinglePostPage.goto(post.slug);

    await expect(Comments.getEditBtnById(oldComment._id)).toBeHidden();
    await expect(Comments.getDeleteBtnById(oldComment._id)).toBeHidden();
  });

  test('The current user cannot edit or delete not their comment even if it is not older than 10 mins', async ({
    SinglePostPage,
    Comments,
    context,
    Api,
  }) => {
    const notCurrentUserComment = createRandomComment(
      {
        author: {
          login: 'not-current-user',
        },
      },
      false,
    );

    Api.routes.comments.getComments.mock({
      body: {
        pages: 1,
        comments: [notCurrentUserComment],
        hasNextPage: false,
        total: 1,
      },
    });

    await mockDate(context, notCurrentUserComment.createdAt);

    await SinglePostPage.goto(post.slug);

    await expect(
      Comments.getEditBtnById(notCurrentUserComment._id),
    ).toBeHidden();
    await expect(
      Comments.getDeleteBtnById(notCurrentUserComment._id),
    ).toBeHidden();
  });

  test('The current user deletes a comment that is not older than 10 mins, sends the delete request', async ({
    SinglePostPage,
    Comments,
    context,
    Api,
  }) => {
    Api.routes.comments.deleteComment.mock({
      status: 200,
    });

    await mockDate(context, currentUserComment.createdAt);

    await SinglePostPage.goto(post.slug);

    await Api.routes.comments.deleteComment.waitForRequest({
      preRequestAction: Comments.deleteCommentById.bind(
        Comments,
        currentUserComment._id,
      ),
    });

    await expect(Comments.getCommentById(currentUserComment._id)).toBeHidden();
  });

  test('The current user edits a comment that is not older than 10 mins, sends the edit request', async ({
    SinglePostPage,
    Comments,
    context,
    Api,
  }) => {
    const editCommentText = 'edited comment';

    Api.routes.comments.updateComment.mock({
      status: 200,
      body: {
        ...currentUserComment,
        body: editCommentText,
      },
    });

    await mockDate(context, currentUserComment.createdAt);

    await SinglePostPage.goto(post.slug);

    await Comments.toggleCommentEditById(currentUserComment._id);
    await Comments.getCommentEditInput().fill(editCommentText);

    const editCommentResponse =
      await Api.routes.comments.updateComment.waitForRequest({
        preRequestAction: Comments.submitEditedComment.bind(Comments),
      });

    expect(editCommentResponse.postDataJSON()).toEqual({
      body: asParagraph(editCommentText),
    });
    await expect(Comments.getCommentById(currentUserComment._id)).toContainText(
      editCommentText,
    );
  });

  test('The current user deletes a comment that has replies', async ({
    SinglePostPage,
    Comments,
    context,
    Api,
  }) => {
    const currentUserCommentWithReplies = createRandomComment(
      {
        author: {
          _id: auth._id,
        },
      },
      true,
    );

    Api.routes.comments.getComments.mock({
      body: {
        pages: 0,
        comments: [currentUserCommentWithReplies],
      },
    });

    Api.routes.comments.deleteComment.mock({
      status: 200,
      body: {
        success: true,
      },
    });

    await mockDate(context, currentUserCommentWithReplies.createdAt);

    await SinglePostPage.goto(post.slug);

    await Api.routes.comments.deleteComment.waitForRequest({
      preRequestAction: Comments.deleteCommentById.bind(
        Comments,
        currentUserCommentWithReplies._id,
      ),
    });

    await expect(
      Comments.getCommentById(currentUserCommentWithReplies._id),
    ).toContainText('This comment has been deleted');
  });
});

test('Formate different dates with relation to the current time correctly', async ({
  context,
  Api,
  Comments,
  SinglePostPage,
}) => {
  await mockDate(context, '2024-06-03T00:00:00Z');

  const comments = [
    createRandomComment({
      _id: '0',
      // 7 seconds ago ~ a few seconds ago
      createdAt: '2024-06-02T23:59:53Z',
    }),
    createRandomComment({
      _id: '1',
      // ~35 minutes ago
      createdAt: '2024-06-02T23:24:53Z',
    }),
    createRandomComment({
      _id: '2',
      // ~ an hour ago
      createdAt: '2024-06-02T22:59:53Z',
    }),
    createRandomComment({
      _id: '3',
      children: [],
      // ~3 hours ago
      createdAt: '2024-06-02T20:59:53Z',
    }),
    createRandomComment({
      _id: '4',
      // ~ a day ago
      createdAt: '2024-06-01T20:59:53Z',
    }),
    createRandomComment({
      _id: '5',
      // ~ 14 days ago
      createdAt: '2024-05-19T20:59:53Z',
    }),
    createRandomComment({
      _id: '6',
      // ~ a month ago
      createdAt: '2024-04-23T00:00:00Z',
    }),
    createRandomComment({
      _id: '7',
      // ~ 5 months ago
      createdAt: '2023-12-20T00:00:00Z',
    }),
    createRandomComment({
      _id: '8',
      // ~ a year ago
      createdAt: '2022-12-20T00:00:00Z',
    }),
    createRandomComment({
      _id: '9',
      // ~ 2 years ago
      createdAt: '2021-12-20T00:00:00Z',
    }),
  ];

  Api.routes.comments.getComments.mock({
    body: {
      pages: 1,
      comments,
      hasNextPage: false,
      total: comments.length,
    },
  });

  await SinglePostPage.goto(post.slug);

  await expect(Comments.getCommentDateById(comments[0]._id)).toContainText(
    '7 seconds ago',
  );
  await expect(Comments.getCommentDateById(comments[1]._id)).toContainText(
    '35 minutes ago',
  );
  await expect(Comments.getCommentDateById(comments[2]._id)).toContainText(
    '1 hour ago',
  );
  await expect(Comments.getCommentDateById(comments[3]._id)).toContainText(
    '3 hours ago',
  );
  await expect(Comments.getCommentDateById(comments[4]._id)).toContainText(
    '1 day ago',
  );
  await expect(Comments.getCommentDateById(comments[5]._id)).toContainText(
    '14 days ago',
  );
  await expect(Comments.getCommentDateById(comments[6]._id)).toContainText(
    '1 month ago',
  );
  await expect(Comments.getCommentDateById(comments[7]._id)).toContainText(
    '5 months ago',
  );
  await expect(Comments.getCommentDateById(comments[8]._id)).toContainText(
    '1 year ago',
  );
  await expect(Comments.getCommentDateById(comments[9]._id)).toContainText(
    '2 years ago',
  );
});
