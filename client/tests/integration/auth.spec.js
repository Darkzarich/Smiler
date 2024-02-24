import { test, expect } from '@playwright/test';
import generateAuth from './fixtures/auth';

test.beforeEach(async ({ context }) => {
  await context.route('*/**/users/get-auth', async (route) => {
    await route.fulfill({
      json: generateAuth(),
    });
  });

  await context.route('*/**/posts*', async (route) => {
    await route.fulfill({
      json: {
        pages: 0,
        posts: [],
      },
    });
  });
});

test('Checks auth status on load and shows an expected state', async ({ page, isMobile }) => {
  const getAuthRequest = page.waitForRequest('*/**/users/get-auth');

  await page.goto('/');

  await getAuthRequest;

  if (isMobile) {
    await page.getByTestId('mobile-menu').click();
  }

  await expect(page.getByTestId('user-signin-form')).toBeVisible();
});

test('Fills Sign In form and sends an expected request body', async ({ page, isMobile }) => {
  await page.goto('/');

  const formData = {
    email: 'test@gmail.com',
    password: '123456',
  };

  if (isMobile) {
    await page.getByTestId('mobile-menu').click();
  }

  await page.getByTestId('user-signin-email').fill(formData.email);
  await page.getByTestId('user-signin-password').fill(formData.password);

  const signInRequest = page.waitForRequest((res) => res.url().includes('/users/auth') && res.method() === 'POST');

  await page.getByTestId('user-signin-submit').click();

  const signInResponse = await signInRequest;

  expect(signInResponse.postDataJSON()).toEqual(formData);
});

test('Fills Sign Up form and sends an expected request body', async ({ page, isMobile }) => {
  await page.goto('/');

  const formData = {
    email: 'test@gmail.com',
    login: 'test',
    password: '123456',
  };

  if (isMobile) {
    page.getByTestId('mobile-menu').click();
  }

  await page.getByTestId('user-form-mode-toggler').click();

  await page.getByTestId('user-signup-email').fill(formData.email);
  await page.getByTestId('user-signup-login').fill(formData.login);
  await page.getByTestId('user-signup-password').fill(formData.password);
  await page.getByTestId('user-signup-confirm').fill(formData.password);

  const singUpRequest = page.waitForRequest((res) => /\/users$/.test(res.url()) && res.method() === 'POST');

  await page.getByTestId('user-signup-submit').click();

  const singUpResponse = await singUpRequest;

  expect(singUpResponse.postDataJSON()).toEqual({
    ...formData,
    confirm: formData.password,
  });
});
