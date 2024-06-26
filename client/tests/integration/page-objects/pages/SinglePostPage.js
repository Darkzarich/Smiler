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

  // eslint-disable-next-line class-methods-use-this
  getUrlWithSlug(slug = '') {
    return `/post/${slug}`;
  }

  async goto(slug = '') {
    await this.page.goto(this.getUrlWithSlug(slug));
  }

  async gotoEditPage(slug = '') {
    await this.page.goto(`${this.getUrlWithSlug(slug)}/edit`);
  }
}
