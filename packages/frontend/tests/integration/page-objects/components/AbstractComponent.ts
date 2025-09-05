import type { Page } from '@playwright/test';

export default class AbstractComponent {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  findContextMenuOption(text = '') {
    return this.page
      .getByTestId('base-context-menu')
      .filter({ has: this.page.getByText(text) });
  }
}
