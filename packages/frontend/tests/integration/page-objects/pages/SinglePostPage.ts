import AbstractPage from './AbstractPage';

export default class SinglePostPage extends AbstractPage {
  // eslint-disable-next-line class-methods-use-this
  getTitle(title = '') {
    return AbstractPage.formatTitle(title);
  }

  // eslint-disable-next-line class-methods-use-this
  getUrlWithSlug(slug = '') {
    return `/post/${slug}`;
  }

  async goto(slug = '') {
    await this.page.goto(this.getUrlWithSlug(slug));
  }

  async gotoComments(slug = '') {
    await this.page.goto(`${this.getUrlWithSlug(slug)}#comments`);
  }

  async gotoEditPage(slug = '') {
    await this.page.goto(`${this.getUrlWithSlug(slug)}/edit`);
  }

  /** How far the top of the comments sits from the bottom of the fixed
   * header, either way: 0 when a link to them lands right under it. */
  async getCommentsOffsetFromHeader() {
    const header = await this.page.getByRole('banner').boundingBox();
    const comments = await this.page.locator('#comments').boundingBox();

    if (!header || !comments) {
      return Infinity;
    }

    return Math.abs(comments.y - (header.y + header.height));
  }
}
