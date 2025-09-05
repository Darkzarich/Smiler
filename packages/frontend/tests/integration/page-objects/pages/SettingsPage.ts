import AbstractPage from './AbstractPage';
import { type Locator, type Page } from '@playwright/test';

export default class SettingsPage extends AbstractPage {
  readonly url = '/user/settings';

  readonly avatarInput: Locator;
  readonly avatarSubmitBtn: Locator;
  readonly bioInput: Locator;
  readonly bioError: Locator;
  readonly bioSubmitBtn: Locator;
  readonly noSubscriptionsBlock: Locator;

  readonly title = AbstractPage.formatTitle('Settings');

  readonly avatarPlaceholderUrl = 'https://placehold.co/128x128';

  constructor(page: Page) {
    super(page);

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
