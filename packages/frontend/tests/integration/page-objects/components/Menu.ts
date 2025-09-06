import { type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

export default class Menu extends AbstractComponent {
  readonly isMobile: boolean;
  readonly createPostBtn: Locator;

  constructor(page: Page, isMobile: boolean) {
    super(page);

    this.isMobile = isMobile;
    this.createPostBtn = page.getByTestId('create-post-btn');
  }

  async openIfMobile() {
    if (this.isMobile) {
      await this.page.getByTestId('mobile-menu').click();
    }
  }

  async fillSearchInput(text = '') {
    await this.page.getByTestId('header-search-input').fill(text);
  }

  async submitSearch() {
    await this.page.getByTestId('header-search-input').press('Enter');
  }

  async goToCreatePostPage() {
    await this.createPostBtn.click();
  }
}
