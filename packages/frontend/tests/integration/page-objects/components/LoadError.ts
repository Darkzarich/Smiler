import type { Locator, Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

export default class LoadError extends AbstractComponent {
  readonly root: Locator;

  readonly retryButton: Locator;

  constructor(page: Page) {
    super(page);

    this.root = page.getByTestId('load-error');
    this.retryButton = page.getByTestId('load-error-retry');
  }
}
