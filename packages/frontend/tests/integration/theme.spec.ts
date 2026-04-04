import { expect } from '@playwright/test';
import test from './page-objects';
import { Theme } from './page-objects/components/ThemeToggle';
import createRandomAuth from '@factory/auth';

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });

  Api.routes.posts.getToday.mock({
    body: {
      pages: 0,
      posts: [],
      hasNextPage: false,
      total: 0,
    },
  });
});

test.describe('Theme Toggle', () => {
  test('Toggles theme between dark and light on desktop', async ({
    PostsPage,
    ThemeToggle,
    Menu,
  }) => {
    await PostsPage.goto();
    await Menu.openIfMobile();

    const initialTheme = await ThemeToggle.getCurrentTheme();
    const oppositeTheme = ThemeToggle.getOppositeTheme(initialTheme);

    expect(initialTheme).toBeTruthy();

    await ThemeToggle.click();
    await ThemeToggle.waitForThemeChange(oppositeTheme);

    const toggledTheme = await ThemeToggle.getCurrentTheme();
    expect(toggledTheme).not.toBe(initialTheme);
  });

  test('Persists theme choice across page reloads', async ({
    page,
    PostsPage,
    ThemeToggle,
    Menu,
  }) => {
    await PostsPage.goto();
    await Menu.openIfMobile();

    const currentTheme = await ThemeToggle.getCurrentTheme();
    const oppositeTheme = ThemeToggle.getOppositeTheme(currentTheme);

    await ThemeToggle.click();
    await ThemeToggle.waitForThemeChange(oppositeTheme);

    await page.reload();

    const persistedTheme = await ThemeToggle.getCurrentTheme();
    expect(persistedTheme).toBe(oppositeTheme);
  });

  test('Respects system theme preference on first visit', async ({
    context,
    PostsPage,
    ThemeToggle,
  }) => {
    await context.clearCookies();
    await context.clearPermissions();

    await PostsPage.goto();

    const isPrefersDark = await ThemeToggle.isPrefersDark();

    const initialTheme = await ThemeToggle.getCurrentTheme();
    expect(initialTheme).toBe(isPrefersDark ? Theme.DARK : Theme.LIGHT);
  });
});

test.describe('Theme on Mobile', () => {
  test('Theme toggle available in mobile menu', async ({
    PostsPage,
    ThemeToggle,
    Menu,
  }) => {
    await PostsPage.goto();
    await Menu.openIfMobile();

    await expect(ThemeToggle.toggle).toBeVisible();
  });

  test('Toggles theme from mobile menu', async ({
    PostsPage,
    Menu,
    ThemeToggle,
    isMobile,
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(!isMobile, 'Skip on desktop - mobile only test');

    await PostsPage.goto();

    let theme = await ThemeToggle.getCurrentTheme();
    const oppositeTheme = ThemeToggle.getOppositeTheme(theme!);

    console.log(theme);

    await Menu.openIfMobile();

    await ThemeToggle.click();

    await ThemeToggle.waitForThemeChange(oppositeTheme);

    theme = await ThemeToggle.getCurrentTheme();
    expect(theme).toBe(oppositeTheme);
  });
});
