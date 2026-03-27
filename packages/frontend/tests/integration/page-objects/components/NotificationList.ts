import { type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

export default class NotificationList extends AbstractComponent {
  readonly pageNoAccessText = 'Only authenticated users can access this page';

  readonly root: Locator;

  constructor(page: Page) {
    super(page);

    this.root = page.getByTestId('notification-list');
  }

  async dismissAll() {
    const closeButtons = this.root.locator(
      '.notification-list__item-close-btn',
    );
    const count = await closeButtons.count();

    for (let i = 0; i < count; i++) {
      try {
        await closeButtons.nth(0).click({ timeout: 1000 });
      } catch {
        // Ignore if button disappears or can't be clicked
      }
    }
  }

  async waitForNoNotifications() {
    await this.page.waitForSelector('.notification-list__item', {
      state: 'hidden',
      timeout: 2000,
    });
  }
}
