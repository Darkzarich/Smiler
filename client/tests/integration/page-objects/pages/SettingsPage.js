export default class SettingsPage {
  url = '/user/settings';

  title = 'Settings | Smiler';

  avatarPlaceholderUrl = 'https://placehold.co/128x128';

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.avatarInput = page.getByTestId('user-settings-avatar-input');
    this.avatarSubmitBtn = page.getByTestId('user-settings-avatar-submit');
    this.bioInput = page.getByTestId('user-settings-bio-input');
    this.bioError = page.getByTestId('user-settings-bio-input-error');
    this.bioSubmitBtn = page.getByTestId('user-settings-bio-submit');

    this.noSubscriptionsBlock = page.getByTestId(
      'user-settings-no-subscriptions',
    );
  }

  async goto() {
    await this.page.goto(this.url);
  }

  getAuthorById(id = '') {
    return this.page.getByTestId(`user-settings-author-${id}`);
  }

  getTagByText(tag = '') {
    return this.page.getByTestId(`user-settings-tags-${tag}`);
  }

  async unfollowAuthor(id = '') {
    await this.page.getByTestId(`user-settings-author-${id}-unfollow`).click();
  }

  async unfollowTag(tag = '') {
    await this.page.getByTestId(`user-settings-tag-${tag}-unfollow`).click();
  }

  async submitBio() {
    await this.bioSubmitBtn.click();
  }

  async submitAvatar() {
    await this.avatarSubmitBtn.click();
  }
}
