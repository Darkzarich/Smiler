export default class SinglePostPage {
  title = ' | Smiler';

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  getTitle(title = '') {
    return `${title}${this.title}`;
  }

  async goto(slug = '') {
    await this.page.goto(`/post/${slug}`);
  }
}
