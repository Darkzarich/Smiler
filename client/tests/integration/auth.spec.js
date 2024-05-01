/* eslint-disable playwright/no-conditional-in-test */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import test from './page-objects';

test.beforeEach(async ({ Api }) => {
  Api.routes.auth.getAuth.mock({
    body: generateAuth(),
  });

  Api.routes.posts.getPosts.mock({
    body: {
      pages: 0,
      posts: [],
    },
  });
});

test.describe('Auth state', () => {
  test('Checks auth status on load and shows an expected state', async ({
    Api,
    page,
    isMobile,
  }) => {
    await Api.routes.auth.getAuth.waitForRequest({
      beforeAction: async () => {
        await page.goto('/');
      },
    });

    if (isMobile) {
      await page.getByTestId('mobile-menu').click();
    }

    await expect(page.getByTestId('user-signin-form')).toBeVisible();
  });

  test('Shows auth-ed user menu', async ({ Api, page, isMobile }) => {
    const auth = generateAuth({
      isAuth: true,
    });

    Api.routes.auth.getAuth.mock({
      body: auth,
    });

    await page.goto('/');

    if (isMobile) {
      await page.getByTestId('mobile-menu').click();
    }

    await expect(page.getByTestId('user-login')).toContainText(auth.login);
    await expect(page.getByTestId('user-rating')).toContainText(
      auth.rating.toString(),
    );
    await expect(page.getByTestId('user-followers-amount')).toContainText(
      auth.followersAmount.toString(),
    );
    await expect(page.getByTestId('create-post-btn')).toBeVisible();
  });

  test('Shows not auth-ed state in the user menu on logout', async ({
    Api,
    page,
    isMobile,
  }) => {
    Api.routes.auth.getAuth.mock({
      body: generateAuth({
        isAuth: true,
      }),
    });

    Api.routes.auth.logout.mock({
      body: {
        ok: true,
      },
    });

    await page.goto('/');

    if (isMobile) {
      await page.getByTestId('mobile-menu').click();
    }

    await Api.routes.auth.logout.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId('logout-btn').click();
      },
    });

    await expect(page.getByTestId('user-login')).toBeHidden();
    await expect(page.getByTestId('user-rating')).toBeHidden();
    await expect(page.getByTestId('user-followers-amount')).toBeHidden();
    await expect(page.getByTestId('create-post-btn')).toBeHidden();
    await expect(page.getByTestId('user-signin-form')).toBeVisible();
  });
});

test.describe('Sign In and Sign Up requests', () => {
  test('Fills Sign In form and sends an expected request body', async ({
    Api,
    page,
    isMobile,
  }) => {
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

    const authResponse = await Api.routes.auth.signIn.waitForRequest({
      beforeAction: async () => {
        await page.getByTestId('user-signin-submit').click();
      },
    });

    expect(authResponse.postDataJSON()).toEqual(formData);
  });

  test('Fills Sign Up form and sends an expected request body', async ({
    Api,
    page,
    isMobile,
  }) => {
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

    const createUserResponse = await Api.routes.auth.signUp.waitForRequest(
      {
        beforeAction: async () => {
          await page.getByTestId('user-signup-submit').click();
        },
      },
    );

    expect(createUserResponse.postDataJSON()).toEqual({
      ...formData,
      confirm: formData.password,
    });
  });
});

test.describe('Sign In validation', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    await page.goto('/');

    if (isMobile) {
      await page.getByTestId('mobile-menu').click();
    }
  });

  test.afterEach(async ({ page }) => {
    // After any validation error the submit button should be disabled
    await expect(page.getByTestId('user-signin-submit')).toBeDisabled();
  });

  test('Shows no validation errors by default', async ({ page }) => {
    await expect(page.getByTestId('user-signin-email-error')).toBeHidden();
    await expect(page.getByTestId('user-signin-password-error')).toBeHidden();
  });

  test('Errors on not a valid email', async ({ page }) => {
    await page.getByTestId('user-signin-email').fill('1234');
    await expect(page.getByTestId('user-signin-email-error')).toContainText(
      'Email is not valid',
    );
  });

  test('Errors on emptied after entering email', async ({ page }) => {
    await page.getByTestId('user-signin-email').fill('1234');
    await page.getByTestId('user-signin-email').clear();
    await expect(page.getByTestId('user-signin-email-error')).toContainText(
      "Email can't be empty",
    );
  });

  test('Errors if password length is not minimum 6', async ({ page }) => {
    await page.getByTestId('user-signin-password').fill('1234');
    await expect(page.getByTestId('user-signin-password-error')).toContainText(
      'Password length must be minimum 6',
    );
  });

  test('Errors on emptied after entering password', async ({ page }) => {
    await page.getByTestId('user-signin-password').fill('1234');
    await page.getByTestId('user-signin-password').clear();
    await expect(page.getByTestId('user-signin-password-error')).toContainText(
      "Password can't be empty",
    );
  });
});

test.describe('Sign Up validation', () => {
  test.beforeEach(async ({ page, isMobile }) => {
    await page.goto('/');

    if (isMobile) {
      await page.getByTestId('mobile-menu').click();
    }

    await page.getByTestId('user-form-mode-toggler').click();
  });

  test.afterEach(async ({ page }) => {
    // After any validation error the submit button should be disabled
    await expect(page.getByTestId('user-signup-submit')).toBeDisabled();
  });

  test('Shows no validation errors by default', async ({ page }) => {
    await expect(page.getByTestId('user-signup-email-error')).toBeHidden();
    await expect(page.getByTestId('user-signup-login-error')).toBeHidden();
    await expect(page.getByTestId('user-signup-password-error')).toBeHidden();
    await expect(page.getByTestId('user-signup-confirm-error')).toBeHidden();
  });

  test('Errors on not a valid email', async ({ page }) => {
    await page.getByTestId('user-signup-email').fill('1234');
    await expect(page.getByTestId('user-signup-email-error')).toContainText(
      'Email is not valid',
    );
  });

  test('Errors on emptied after entering email', async ({ page }) => {
    await page.getByTestId('user-signup-email').fill('1234');
    await page.getByTestId('user-signup-email').clear();
    await expect(page.getByTestId('user-signup-email-error')).toContainText(
      "Email can't be empty",
    );
  });

  test('Errors if login length is not minimum 3', async ({ page }) => {
    await page.getByTestId('user-signup-login').fill('te');
    await expect(page.getByTestId('user-signup-login-error')).toContainText(
      'Login length must be 3-10',
    );
  });

  test('Errors if login length is over 10', async ({ page }) => {
    await page.getByTestId('user-signup-login').fill('12345678910');
    await expect(page.getByTestId('user-signup-login-error')).toContainText(
      'Login length must be 3-10',
    );
  });

  test('Errors if password length is not minimum 6', async ({ page }) => {
    await page.getByTestId('user-signup-password').fill('1234');
    await expect(page.getByTestId('user-signup-password-error')).toContainText(
      'Password length must be minimum 6',
    );
  });

  test('Errors on emptied after entering password', async ({ page }) => {
    await page.getByTestId('user-signup-password').fill('1234');
    await page.getByTestId('user-signup-password').clear();
    await expect(page.getByTestId('user-signup-password-error')).toContainText(
      "Password can't be empty",
    );
  });

  test('Errors if confirm length is not minimum 6', async ({ page }) => {
    await page.getByTestId('user-signup-confirm').fill('1234');
    await expect(page.getByTestId('user-signup-confirm-error')).toContainText(
      'Password confirm length must be minimum 6',
    );
  });

  test('Errors on emptied after entering confirm', async ({ page }) => {
    await page.getByTestId('user-signup-confirm').fill('1234');
    await page.getByTestId('user-signup-confirm').clear();
    await expect(page.getByTestId('user-signup-confirm-error')).toContainText(
      "Password confirm can't be empty",
    );
  });

  test('Errors if password and confirm are not equal', async ({ page }) => {
    await page.getByTestId('user-signup-password').fill('123456');
    await page.getByTestId('user-signup-confirm').fill('abcdef');
    await expect(page.getByTestId('user-signup-confirm-error')).toContainText(
      'Password and password confirm must be equal',
    );
  });
});
