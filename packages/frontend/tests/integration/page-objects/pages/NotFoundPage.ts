import type { Page } from '@playwright/test';
import AbstractPage from './AbstractPage';

export default class NotFoundPage extends AbstractPage {
  readonly title = AbstractPage.formatTitle('Not Found');

  readonly url = '/error/404';

  async waitForNotFoundPage() {
    await this.page.waitForURL(this.url);
  }
}
