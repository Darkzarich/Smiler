import { expect, type Locator, type Page } from '@playwright/test';
import AbstractPage from './AbstractPage';

export default class ProfilePage extends AbstractPage {
  readonly login: Locator;
  readonly rating: Locator;
  readonly followersCount: Locator;
  readonly bio: Locator;
  readonly unfollowBtn: Locator;
  readonly followBtn: Locator;

  constructor(page: Page) {
    super(page);

    this.login = page.getByTestId('user-profile-login');
    this.rating = page.getByTestId('user-profile-rating').first();
    this.followersCount = page
      .getByTestId('user-profile-followers-count')
      .first();
    this.bio = page.getByTestId('user-profile-bio');
    this.unfollowBtn = page.getByTestId('user-profile-unfollow-btn');
    this.followBtn = page.getByTestId('user-profile-follow-btn');
  }

  // eslint-disable-next-line class-methods-use-this
  getTitle(login = '') {
    return AbstractPage.formatTitle(login);
  }

  // eslint-disable-next-line class-methods-use-this
  getUrlWithLogin(login = '') {
    return `/user/@${login}`;
  }

  async goto(login = '') {
    await this.page.goto(this.getUrlWithLogin(login));
  }

  async follow() {
    await this.followBtn.click();
  }

  async unfollow() {
    await this.unfollowBtn.click();
  }
}
