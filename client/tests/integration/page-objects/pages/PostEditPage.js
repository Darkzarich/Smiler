import AbstractPage from './AbstractPage';

export default class PostEditPage extends AbstractPage {
  title = AbstractPage.formatTitle('Edit Post');

  // eslint-disable-next-line class-methods-use-this
  getUrlWithSlug(slug = '') {
    return `/post/${slug}/edit`;
  }

  async goto(slug = '') {
    await this.page.goto(this.getUrlWithSlug(slug));
  }
}
