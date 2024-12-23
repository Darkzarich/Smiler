export default class Menu {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {boolean} isMobile
   */
  constructor(page, isMobile) {
    this.page = page;
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
