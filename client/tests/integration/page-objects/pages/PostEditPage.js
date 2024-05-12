export default class PostEditPage {
  title = 'Edit Post | Smiler';

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // eslint-disable-next-line class-methods-use-this
  getUrlWithSlug(slug = '') {
    return `/post/${slug}/edit`;
  }

  async goto(slug = '') {
    await this.page.goto(this.getUrlWithSlug(slug));
  }
}
