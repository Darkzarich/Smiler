import type { Page } from '@playwright/test';

export default class AbstractComponent {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /** Exact, or "Follow tag" would also match "Unfollow tag" */
  findContextMenuOption(text = '') {
    return this.page
      .getByTestId('base-context-menu')
      .getByRole('button', { name: text, exact: true });
  }
}
