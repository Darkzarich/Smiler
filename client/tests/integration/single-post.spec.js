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
        comments: [
          comment,
        ],
      },
    });
  });
});

test('Fetches the post by post slug', async ({ page }) => {
  const postBySlugRequest = page.waitForRequest(`*/**/posts/${post.slug}`);

  await page.goto(`/${post.slug}`);

  await postBySlugRequest;

  await expect(page.getByTestId(`post-${post.id}-title`)).toContainText(post.title);
});

test('Fetches post comments by post id', async ({ page }) => {
  const commentsRequest = page.waitForRequest('*/**/comments*');

  await page.goto(`/${post.slug}`);

  const commentsResponse = await commentsRequest;

  expect(commentsResponse.url()).toContain(`limit=10&post=${post.id}`);
});

test.describe('Sections', () => {
  async function mockPostSection(context, section) {
    const postWithSections = {
      id: '1',
      sections: Array.isArray(section) ? section : [
        section,
      ],
    };

    await context.route(`*/**/posts/${post.slug}`, async (route) => {
      await route.fulfill({
        json: generatePost(postWithSections),
      });
    });

    return post;
  }

  test('Shows text section', async ({ context, page }) => {
    const section = {
      hash: '1',
      type: 'text',
      content: 'test',
    };

    const mockedPost = await mockPostSection(context, section);

    await page.goto(`/${mockedPost.slug}`);

    await expect(page.getByTestId(`post-${mockedPost.id}-text-${section.hash}`)).toContainText(section.content);
  });

  test('Shows pic section', async ({ context, page }) => {
    const section = {
      hash: '2',
      type: 'pic',
      url: 'test',
    };

    const mockedPost = await mockPostSection(context, section);

    await page.goto(`/${mockedPost.slug}`);

    await expect(page.getByTestId(`post-${mockedPost.id}-pic-${section.hash}`)).toBeVisible();
    await expect(page.getByTestId(`post-${mockedPost.id}-pic-${section.hash}`)).toHaveAttribute('alt', section.url);
  });

  test('Shows video section', async ({ context, page }) => {
    const section = {
      hash: '3',
      type: 'vid',
      url: 'test',
    };

    const mockedPost = await mockPostSection(context, section);

    await page.goto(`/${mockedPost.slug}`);

    await expect(page.getByTestId(`post-${mockedPost.id}-vid-${section.hash}`)).toBeVisible();
    await expect(page.getByTestId(`post-${mockedPost.id}-vid-${section.hash}`)).toHaveAttribute('src', section.url);
  });

  test('Shows multiple sections at the same time', async ({ context, page }) => {
    const sections = [
      {
        hash: '1',
        type: 'pic',
        url: 'test',
      },
      {
        hash: '2',
        type: 'text',
        content: 'test text',
      },
      {
        hash: '3',
        type: 'vid',
        url: 'test',
      },
    ];

    const mockedPost = await mockPostSection(context, sections);

    await page.goto(`/${mockedPost.slug}`);

    await expect(page.getByTestId(`post-${mockedPost.id}-pic-${sections[0].hash}`)).toBeVisible();
    await expect(page.getByTestId(`post-${mockedPost.id}-pic-${sections[0].hash}`)).toHaveAttribute('alt', sections[0].url);
    await expect(page.getByTestId(`post-${mockedPost.id}-text-${sections[1].hash}`)).toContainText(sections[1].content);
    await expect(page.getByTestId(`post-${mockedPost.id}-vid-${sections[2].hash}`)).toBeVisible();
    await expect(page.getByTestId(`post-${mockedPost.id}-vid-${sections[2].hash}`)).toHaveAttribute('src', sections[2].url);
  });
});

test.describe('Comments', () => {
  test('Shows comment with its child comments', async ({ page }) => {
    await page.goto(`/${post.slug}`);

    await expect(page.getByTestId(`comment-${comment.id}-body`)).toContainText(comment.body);
    await expect(page.getByTestId(`comment-${comment.children[0].id}-body`)).toContainText(comment.children[0].body);
    await expect(page.getByTestId(`comment-${comment.children[0].children[0].id}-body`)).toContainText(comment.children[0].children[0].body);
  });

  test('Hides children comments if root comment is collapsed', async ({ page }) => {
    await page.goto(`/${post.slug}`);

    await page.getByTestId(`comment-${comment.id}-expander`).click();

    await expect(page.getByTestId(`comment-${comment.children[0].id}-body`)).not.toBeVisible();
    await expect(page.getByTestId(`comment-${comment.children[0].children[0].id}-body`)).not.toBeVisible();
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

      const upvoteRequest = page.waitForRequest((res) => res.url().includes(`/comments/${comment.id}/rate`) && res.method() === 'PUT');

      await page.getByTestId(dataTestIds.upvote).click();

      const upvoteResponse = await upvoteRequest;

      expect(upvoteResponse.postDataJSON()).toEqual({
        negative: false,
      });
    });

    test('Downvotes a comment', async ({ page }) => {
      await page.goto(`/${post.slug}`);

      await page.getByTestId(`comment-${comment.id}-body`).isVisible();

      const downvoteRequest = page.waitForRequest((res) => res.url().includes(`/comments/${comment.id}/rate`) && res.method() === 'PUT');

      await page.getByTestId(dataTestIds.downvote).click();

      const downvoteResponse = await downvoteRequest;

      expect(downvoteResponse.postDataJSON()).toEqual({
        negative: true,
      });
    });

    test('Removes a vote from a comment if it was upvoted before', async ({ page, context }) => {
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

      await page.getByTestId(`comment-${comment.id}-body`).isVisible();

      const removeUpvoteRequest = page.waitForRequest((res) => res.url().includes(`/comments/${comment.id}/rate`) && res.method() === 'DELETE');

      await page.getByTestId(dataTestIds.downvote).click();

      await removeUpvoteRequest;
    });

    test('Removes a vote from a comment if it was downvoted before', async ({ page, context }) => {
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

      await page.getByTestId(`comment-${comment.id}-body`).isVisible();

      const removeDownVoteRequest = page.waitForRequest((res) => res.url().includes(`/comments/${comment.id}/rate`) && res.method() === 'DELETE');

      await page.getByTestId(dataTestIds.upvote).click();

      await removeDownVoteRequest;
    });
  });
});
