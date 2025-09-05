import AbstractComponent from './AbstractComponent';
import { type Locator, type Page } from '@playwright/test';

export default class NotificationList extends AbstractComponent {
  readonly pageNoAccessText = 'Only authenticated users can access this page';

  readonly root: Locator;

  constructor(page: Page) {
    super(page);

    this.root = page.getByTestId('notification-list');
  }
}
