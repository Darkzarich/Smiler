import { type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

/** Fields are looked up inside the prompt: the desktop sidebar has the same forms */
export default class AuthPrompt extends AbstractComponent {
  readonly panel: Locator;
  readonly title: Locator;
  readonly closeBtn: Locator;
  readonly SignInForm: Locator;
  readonly SignUpForm: Locator;

  constructor(page: Page) {
    super(page);

    this.panel = page.getByTestId('auth-prompt-panel');
    this.title = this.panel.getByTestId('auth-prompt-title');
    this.closeBtn = this.panel.getByTestId('auth-prompt-close');
    this.SignInForm = this.panel.getByTestId('signin-form');
    this.SignUpForm = this.panel.getByTestId('signup-form');
  }

  async signIn(email = 'visitor@example.com', password = 'password') {
    await this.panel.getByTestId('signin-form-email').fill(email);
    await this.panel.getByTestId('signin-form-password').fill(password);
    await this.panel.getByTestId('signin-form-submit').click();
  }

  async close() {
    await this.closeBtn.click();
  }
}
