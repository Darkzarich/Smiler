export default class CurrentUser {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.login = page.getByTestId('user-login');
    this.rating = page.getByTestId('user-profile-rating');
    this.followersAmount = page.getByTestId('user-profile-followers-count');
    this.createPostBtn = page.getByTestId('create-post-btn');
  }

  async clickLogoutBtn() {
    await this.page.getByTestId('logout-btn').click();
  }
}
