export default class AuthForm {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.SignInForm = page.getByTestId('signin-form');
    this.SignUpForm = page.getByTestId('signup-form');
    this.authFormModeToggler = page.getByTestId('user-form-mode-toggler');

    this.signInPassword = page.getByTestId('signin-form-password');
    this.signInPasswordError = page.getByTestId('signin-form-password-error');
    this.signInEmail = page.getByTestId('signin-form-email');
    this.signInEmailError = page.getByTestId('signin-form-email-error');
    this.signInSubmitBtn = page.getByTestId('signin-form-submit');

    this.signUpEmail = page.getByTestId('signup-form-email');
    this.signUpEmailError = page.getByTestId('signup-form-email-error');
    this.signUpLogin = page.getByTestId('signup-form-login');
    this.signUpLoginError = page.getByTestId('signup-form-login-error');
    this.signUpPassword = page.getByTestId('signup-form-password');
    this.signUpPasswordError = page.getByTestId('signup-form-password-error');
    this.signUpConfirm = page.getByTestId('signup-form-confirm');
    this.signUpConfirmError = page.getByTestId('signup-form-confirm-error');
    this.signUpSubmitBtn = page.getByTestId('signup-form-submit');
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
