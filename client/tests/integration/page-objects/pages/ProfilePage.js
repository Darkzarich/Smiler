// @ts-check

export default class ProfilePage {
  title = ' | Smiler';

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.login = page.getByTestId('user-profile-login');
    this.rating = page.getByTestId('user-profile-rating');
    this.followersCount = page.getByTestId('user-profile-followers-count');
    this.bio = page.getByTestId('user-profile-bio');
    this.unfollowBtn = page.getByTestId('user-profile-unfollow-btn');
    this.followBtn = page.getByTestId('user-profile-follow-btn');
  }

  getTitle(login = '') {
    return `${login}${this.title}`;
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
