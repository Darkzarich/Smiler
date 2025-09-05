import { type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

export default class CurrentUser extends AbstractComponent {
  readonly login: Locator;
  readonly rating: Locator;
  readonly followersAmount: Locator;
  readonly createPostBtn: Locator;

  constructor(page: Page) {
    super(page);

    this.login = page.getByTestId('user-login');
    this.rating = page.getByTestId('user-profile-rating');
    this.followersAmount = page.getByTestId('user-profile-followers-count');
    this.createPostBtn = page.getByTestId('create-post-btn');
  }

  async clickLogoutBtn() {
    await this.page.getByTestId('logout-btn').click();
  }
}
