export default class AuthForm {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.SignInForm = page.getByTestId('user-signin-form');
    this.SignUpForm = page.getByTestId('user-signup-form');
    this.authFormModeToggler = page.getByTestId('user-form-mode-toggler');

    this.signInPasswordInput = page.getByTestId('user-signin-password');
    this.signInPasswordError = page.getByTestId('user-signin-password-error');
    this.signInEmailInput = page.getByTestId('user-signin-email');
    this.signInEmailError = page.getByTestId('user-signin-email-error');
    this.signInSubmitBtn = page.getByTestId('user-signin-submit');

    this.signUpEmailInput = page.getByTestId('user-signup-email');
    this.signUpEmailError = page.getByTestId('user-signup-email-error');
    this.signUpLoginInput = page.getByTestId('user-signup-login');
    this.signUpLoginError = page.getByTestId('user-signup-login-error');
    this.signUpPasswordInput = page.getByTestId('user-signup-password');
    this.signUpPasswordError = page.getByTestId('user-signup-password-error');
    this.signUpConfirmInput = page.getByTestId('user-signup-confirm');
    this.signUpConfirmError = page.getByTestId('user-signup-confirm-error');
    this.signUpSubmitBtn = page.getByTestId('user-signup-submit');
  }

  async clickSignInBtn() {
    await this.signInSubmitBtn.click();
  }

  async clickSignUpBtn() {
    await this.signUpSubmitBtn.click();
  }

  async toggleAuthFormMode() {
    await this.authFormModeToggler.click();
  }
}
