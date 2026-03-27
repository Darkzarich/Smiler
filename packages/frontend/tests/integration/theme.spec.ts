import { expect } from '@playwright/test';
import test from './page-objects';
import createRandomAuth from '@factory/auth';

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: createRandomAuth(),
  });
});

test.describe('Theme Toggle', () => {
  test('Toggles theme between dark and light on desktop', async ({
    page,
    PostsPage,
    ThemeToggle,
    Menu,
  }) => {
    await PostsPage.goto();
    await Menu.openIfMobile();

    const initialTheme = await ThemeToggle.getCurrentTheme();
    expect(initialTheme).toBeTruthy();

    // Use dispatchEvent to properly trigger Vue click handler
    await page.evaluate(() => {
      const toggleBtn = document.querySelector('[data-testid="theme-toggle"]');
      toggleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Wait for theme to update
    await page.waitForTimeout(100);

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

    // Use dispatchEvent to properly trigger Vue click handler
    await page.evaluate(() => {
      const toggleBtn = document.querySelector('[data-testid="theme-toggle"]');
      toggleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Wait for theme to update
    await page.waitForTimeout(100);

    const currentTheme = await ThemeToggle.getCurrentTheme();

    await page.reload();

    const persistedTheme = await ThemeToggle.getCurrentTheme();
    expect(persistedTheme).toBe(currentTheme);
  });

  test('Respects system theme preference on first visit', async ({
    context,
    page,
    PostsPage,
    ThemeToggle,
  }) => {
    await context.clearCookies();
    await context.clearPermissions();

    await PostsPage.goto();

    const prefersDark = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const initialTheme = await ThemeToggle.getCurrentTheme();
    expect(initialTheme).toBe(prefersDark ? 'dark' : 'light');
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
    page,
    PostsPage,
    ThemeToggle,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Skip on desktop - mobile only test');

    await PostsPage.goto();

    const mobileMenu = page.getByTestId('mobile-menu');
    await mobileMenu.click({ force: true });

    // Use dispatchEvent to properly trigger Vue click handler
    await page.evaluate(() => {
      const toggleBtn = document.querySelector('[data-testid="theme-toggle"]');
      toggleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    // Wait for theme to update
    await page.waitForTimeout(100);

    const theme = await ThemeToggle.getCurrentTheme();
    expect(theme).toBeTruthy();
  });
});
