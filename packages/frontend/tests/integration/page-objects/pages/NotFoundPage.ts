import type { Locator, Page } from '@playwright/test';
import AbstractPage from './AbstractPage';

export default class NotFoundPage extends AbstractPage {
  readonly title = AbstractPage.formatTitle('Not Found');

  readonly url = '/error/404';

  readonly root: Locator;

  constructor(page: Page) {
    super(page);

    this.root = page.getByTestId('not-found');
  }
}
