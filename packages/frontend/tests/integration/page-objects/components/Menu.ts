import { type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

export default class Menu extends AbstractComponent {
  readonly isMobile: boolean;
  readonly createPostBtn: Locator;
  readonly mobileMenuBtn: Locator;
  readonly mobileMenu: Locator;

  constructor(page: Page, isMobile: boolean) {
    super(page);

    this.isMobile = isMobile;
    this.createPostBtn = page.getByTestId('create-post-btn');
    this.mobileMenuBtn = page.getByTestId('mobile-menu');
    this.mobileMenu = page.getByTestId('mobile-menu-dialog');
  }

  async openIfMobile() {
    if (this.isMobile) {
      await this.mobileMenuBtn.click();
    }
  }

  async fillSearchInput(text = '') {
    await this.page.getByTestId('header-search-input').fill(text);
  }

  async submitSearch() {
    await this.page.getByTestId('header-search-input').press('Enter');
  }

  async clickSearchButton() {
    await this.page
      .getByRole('button', { name: 'Search', exact: true })
      .click();
  }

  async goToCreatePostPage() {
    await this.createPostBtn.click();
  }
}
