/* eslint-disable no-shadow */
/* eslint-disable playwright/no-conditional-in-test */
// @ts-check

import { expect } from '@playwright/test';
import generateAuth from './factory/auth';
import test from './page-objects';
import AuthForm from './page-objects/components/AuthForm';
import CurrentUser from './page-objects/components/CurrentUser';

test.use({
  AuthForm: async ({ page }, use) => {
    await use(new AuthForm(page));
  },
  CurrentUser: async ({ page }, use) => {
    await use(new CurrentUser(page));
  },
});

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
    PostsPage,
    AuthForm,
    Menu,
  }) => {
    await Api.routes.auth.getAuth.waitForRequest({
      beforeAction: async () => {
        await PostsPage.goto();
      },
    });

    await Menu.openIfMobile();

    await expect(AuthForm.SignInForm).toBeVisible();
  });

  test('Shows auth-ed user menu', async ({
    Api,
    PostsPage,
    CurrentUser,
    Menu,
  }) => {
    const auth = generateAuth({
      isAuth: true,
    });

    Api.routes.auth.getAuth.mock({
      body: auth,
    });

    await PostsPage.goto();

    await Menu.openIfMobile();

    await expect(CurrentUser.login).toContainText(auth.login);
    await expect(CurrentUser.rating).toContainText(auth.rating.toString());
    await expect(CurrentUser.followersAmount).toContainText(
      auth.followersAmount.toString(),
    );
    await expect(Menu.createPostBtn).toBeVisible();
  });

  test('Shows not auth-ed state in the user menu on logout', async ({
    Api,
    PostsPage,
    Menu,
    CurrentUser,
    AuthForm,
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

    await PostsPage.goto();

    await Menu.openIfMobile();

    await Api.routes.auth.logout.waitForRequest({
      beforeAction: CurrentUser.clickLogoutBtn.bind(CurrentUser),
    });

    await expect(CurrentUser.login).toBeHidden();
    await expect(CurrentUser.rating).toBeHidden();
    await expect(CurrentUser.followersAmount).toBeHidden();
    await expect(Menu.createPostBtn).toBeHidden();
    await expect(AuthForm.SignUpForm).toBeHidden();
    await expect(AuthForm.SignInForm).toBeVisible();
  });
});

test.describe('Sign In and Sign Up requests', () => {
  test('Fills Sign In form and sends an expected request body', async ({
    Api,
    PostsPage,
    Menu,
    AuthForm,
  }) => {
    await PostsPage.goto();

    const formData = {
      email: 'test@gmail.com',
      password: '123456',
    };

    await Menu.openIfMobile();

    await AuthForm.signInEmailInput.fill(formData.email);
    await AuthForm.signInPasswordInput.fill(formData.password);

    const authResponse = await Api.routes.auth.signIn.waitForRequest({
      beforeAction: AuthForm.clickSignInBtn.bind(AuthForm),
    });

    expect(authResponse.postDataJSON()).toEqual(formData);
  });

  test('Fills Sign Up form and sends an expected request body', async ({
    Api,
    PostsPage,
    Menu,
    AuthForm,
  }) => {
    await PostsPage.goto();

    const formData = {
      email: 'test@gmail.com',
      login: 'test',
      password: '123456',
    };

    await Menu.openIfMobile();

    await AuthForm.toggleAuthFormMode();

    await AuthForm.signUpEmailInput.fill(formData.email);
    await AuthForm.signUpLoginInput.fill(formData.login);
    await AuthForm.signUpPasswordInput.fill(formData.password);
    await AuthForm.signUpConfirmInput.fill(formData.password);

    const createUserResponse = await Api.routes.auth.signUp.waitForRequest({
      beforeAction: AuthForm.clickSignUpBtn.bind(AuthForm),
    });

    expect(createUserResponse.postDataJSON()).toEqual({
      ...formData,
      confirm: formData.password,
    });
  });
});

test.describe('Sign In validation', () => {
  test.beforeEach(async ({ PostsPage, Menu }) => {
    await PostsPage.goto();
    await Menu.openIfMobile();
  });

  test.afterEach(async ({ AuthForm }) => {
    // After any validation error the submit button should be disabled
    await expect(AuthForm.signInSubmitBtn).toBeDisabled();
  });

  test('Shows no validation errors by default', async ({ AuthForm }) => {
    await expect(AuthForm.signInEmailError).toBeHidden();

    await expect(AuthForm.signInPasswordError).toBeHidden();
  });

  test('Errors on not a valid email', async ({ AuthForm }) => {
    await AuthForm.signInEmailInput.fill('1234');

    await expect(AuthForm.signInEmailError).toContainText('Email is not valid');
  });

  test('Errors on emptied after entering email', async ({ AuthForm }) => {
    await AuthForm.signInEmailInput.fill('1234');
    await AuthForm.signInEmailInput.clear();

    await expect(AuthForm.signInEmailError).toContainText(
      "Email can't be empty",
    );
  });

  test('Errors if password length is not minimum 6', async ({ AuthForm }) => {
    await AuthForm.signInPasswordInput.fill('1234');

    await expect(AuthForm.signInPasswordError).toContainText(
      'Password length must be minimum 6',
    );
  });

  test('Errors on emptied after entering password', async ({ AuthForm }) => {
    await AuthForm.signInPasswordInput.fill('1234');
    await AuthForm.signInPasswordInput.clear();

    await expect(AuthForm.signInPasswordError).toContainText(
      "Password can't be empty",
    );
  });
});

test.describe('Sign Up validation', () => {
  test.beforeEach(async ({ PostsPage, Menu, AuthForm }) => {
    await PostsPage.goto();
    await Menu.openIfMobile();

    await AuthForm.toggleAuthFormMode();
  });

  test.afterEach(async ({ AuthForm }) => {
    // After any validation error the submit button should be disabled
    await expect(AuthForm.signUpSubmitBtn).toBeDisabled();
  });

  test('Shows no validation errors by default', async ({ AuthForm }) => {
    await expect(AuthForm.signUpEmailError).toBeHidden();
    await expect(AuthForm.signUpLoginError).toBeHidden();
    await expect(AuthForm.signUpPasswordError).toBeHidden();
    await expect(AuthForm.signUpConfirmError).toBeHidden();
  });

  test('Errors on not a valid email', async ({ AuthForm }) => {
    await AuthForm.signUpEmailInput.fill('1234');

    await expect(AuthForm.signUpEmailError).toContainText('Email is not valid');
  });

  test('Errors on emptied after entering email', async ({ AuthForm }) => {
    await AuthForm.signUpEmailInput.fill('1234');
    await AuthForm.signUpEmailInput.clear();

    await expect(AuthForm.signUpEmailError).toContainText(
      "Email can't be empty",
    );
  });

  test('Errors if login length is not minimum 3', async ({ AuthForm }) => {
    await AuthForm.signUpLoginInput.fill('te');

    await expect(AuthForm.signUpLoginError).toContainText(
      'Login length must be 3-10',
    );
  });

  test('Errors if login length is over 10', async ({ AuthForm }) => {
    await AuthForm.signUpLoginInput.fill('12345678910');

    await expect(AuthForm.signUpLoginError).toContainText(
      'Login length must be 3-10',
    );
  });

  test('Errors if password length is not minimum 6', async ({ AuthForm }) => {
    await AuthForm.signUpPasswordInput.fill('1234');

    await expect(AuthForm.signUpPasswordError).toContainText(
      'Password length must be minimum 6',
    );
  });

  test('Errors on emptied after entering password', async ({ AuthForm }) => {
    await AuthForm.signUpPasswordInput.fill('1234');
    await AuthForm.signUpPasswordInput.clear();

    await expect(AuthForm.signUpPasswordError).toContainText(
      "Password can't be empty",
    );
  });

  test('Errors if confirm length is not minimum 6', async ({ AuthForm }) => {
    await AuthForm.signUpConfirmInput.fill('1234');

    await expect(AuthForm.signUpConfirmError).toContainText(
      'Password confirm length must be minimum 6',
    );
  });

  test('Errors on emptied after entering confirm', async ({ AuthForm }) => {
    await AuthForm.signUpConfirmInput.fill('1234');
    await AuthForm.signUpConfirmInput.clear();

    await expect(AuthForm.signUpConfirmError).toContainText(
      "Password confirm can't be empty",
    );
  });

  test('Errors if password and confirm are not equal', async ({ AuthForm }) => {
    await AuthForm.signUpPasswordInput.fill('123456');
    await AuthForm.signUpConfirmInput.fill('abcdef');

    await expect(AuthForm.signUpConfirmError).toContainText(
      'Password and password confirm must be equal',
    );
  });
});
