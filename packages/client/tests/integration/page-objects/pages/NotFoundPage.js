import AbstractPage from './AbstractPage';

export default class NotFoundPage extends AbstractPage {
  title = AbstractPage.formatTitle('Not Found');

  url = '/error/404';

  async waitForNotFoundPage() {
    await this.page.waitForURL(this.url);
  }
}
