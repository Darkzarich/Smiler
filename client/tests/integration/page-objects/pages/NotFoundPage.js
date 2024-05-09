export default class NotFoundPage {
  title = 'Not Found | Smiler';

  url = '/error/404';

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async waitForNotFoundPage() {
    await this.page.waitForURL(this.url);
  }
}
