/* eslint-disable no-await-in-loop */

import { expect } from '@playwright/test';
import test from './page-objects';
import createRandomAuth from '@factory/auth';
import createRandomPost from '@factory/post';
import createRandomProfile from '@factory/profile';

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });
});

test('Redirects to 404 page if page does not exist', async ({
  page: currentPage,
  NotFoundPage,
}) => {
  await currentPage.goto('100-percent/not/existing/page');

  await expect(currentPage).toHaveURL(NotFoundPage.url);
  await expect(currentPage).toHaveTitle(NotFoundPage.title);
});

test.describe('Header between phone and desktop widths', () => {
  test.beforeEach(async ({ Api }) => {
    Api.routes.auth.getAuth.mock({
      body: createRandomAuth({ isAuth: true }),
    });

    Api.routes.posts.getToday.mock({
      body: { posts: [], hasNextPage: false },
    });
  });

  for (const { width, inlineNav } of [
    { width: 768, inlineNav: false },
    { width: 820, inlineNav: false },
    { width: 900, inlineNav: true },
    { width: 1000, inlineNav: true },
  ]) {
    test(`Fits a ${width}px wide window without wrapping the nav`, async ({
      page,
      PostsPage,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await PostsPage.goto(PostsPage.urls.today);

      const header = page.locator('header');

      await expect(header.getByRole('img', { name: 'avatar' })).toBeVisible();
      await expect(header.getByTestId('mobile-menu')).toBeVisible({
        visible: !inlineNav,
      });
      await expect(header.getByTestId('today-link')).toBeVisible({
        visible: inlineNav,
      });

      const layout = await header.evaluate((el) => ({
        pastRightEdge: [...el.querySelectorAll('*')]
          .filter((child) => child.getBoundingClientRect().right > innerWidth)
          .map((child) => child.outerHTML.slice(0, 80)),
        // A text range gives one rect per line the label takes
        wrappedLinks: [...el.querySelectorAll('nav a')]
          .filter((link) => {
            const range = document.createRange();

            range.selectNodeContents(link);

            return range.getClientRects().length > 1;
          })
          .map((link) => link.textContent?.trim()),
      }));

      expect(layout).toEqual({ pastRightEdge: [], wrappedLinks: [] });
    });
  }
});

test.describe('Page gutter between phone and desktop widths', () => {
  test.beforeEach(async ({ Api }) => {
    Api.routes.posts.getToday.mock({
      body: { posts: [createRandomPost()], hasNextPage: false },
    });
  });

  for (const width of [600, 768, 1024, 1110]) {
    test(`Keeps the page off the edges of a ${width}px wide window`, async ({
      page,
      PostsPage,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await PostsPage.goto(PostsPage.urls.today);
      await expect(page.getByTestId('signin-form')).toBeVisible();

      const gaps = await page
        .locator('main')
        .locator('..')
        .evaluate((row) => {
          const boxes = [...row.querySelectorAll('*')]
            .map((el) => el.getBoundingClientRect())
            .filter((box) => box.width > 0);

          return {
            left: Math.min(...boxes.map((box) => box.left)),
            right:
              document.documentElement.clientWidth -
              Math.max(...boxes.map((box) => box.right)),
          };
        });

      expect(gaps.left).toBeGreaterThanOrEqual(16);
      expect(gaps.right).toBeGreaterThanOrEqual(16);
    });
  }
});

test.describe('Mobile menu', () => {
  const auth = createRandomAuth({ isAuth: true });

  test.beforeEach(async ({ Api, isMobile }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(!isMobile, 'The menu replaces the nav on narrow screens only');

    Api.routes.auth.getAuth.mock({ body: auth });

    Api.routes.posts.getToday.mock({
      body: { posts: [], hasNextPage: false },
    });

    Api.routes.posts.getPosts.mock({
      body: { posts: [], hasNextPage: false },
    });

    Api.routes.users.getUserProfile.mock({
      body: createRandomProfile(),
    });
  });

  test('Closes after a link to a page of the same kind', async ({
    page,
    ProfilePage,
    Menu,
  }) => {
    await ProfilePage.goto('someone-else');
    await Menu.openIfMobile();

    await Menu.mobileMenu.getByTestId('user-login').click();

    await expect(page).toHaveURL(ProfilePage.getUrlWithLogin(auth.login));
    await expect(Menu.mobileMenu).toBeHidden();
  });

  test('Closes after a link to the page already shown', async ({
    PostsPage,
    Menu,
  }) => {
    await PostsPage.goto(PostsPage.urls.today);
    await Menu.openIfMobile();

    await Menu.mobileMenu.getByTestId('today-link').click();

    await expect(Menu.mobileMenu).toBeHidden();
  });

  test('Takes focus while open and closes on Escape', async ({
    page,
    PostsPage,
    Menu,
  }) => {
    await PostsPage.goto(PostsPage.urls.today);
    await Menu.openIfMobile();

    await expect(Menu.mobileMenu).toHaveRole('dialog');

    const closeBtn = Menu.mobileMenu.getByRole('button', {
      name: 'Close menu',
    });

    await expect(closeBtn).toBeFocused();

    // Shift+Tab from the first control wraps to the last, never behind the menu
    await page.keyboard.press('Shift+Tab');
    await expect(Menu.mobileMenu.locator(':focus')).toHaveCount(1);
    await expect(closeBtn).not.toBeFocused();

    await page.keyboard.press('Tab');
    await expect(closeBtn).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(Menu.mobileMenu).toBeHidden();
    await expect(Menu.mobileMenuBtn).toBeFocused();
  });
});
