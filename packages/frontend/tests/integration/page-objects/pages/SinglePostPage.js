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

  async gotoEditPage(slug = '') {
    await this.page.goto(`${this.getUrlWithSlug(slug)}/edit`);
  }
}
