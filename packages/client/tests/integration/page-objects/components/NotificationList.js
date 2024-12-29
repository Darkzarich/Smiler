export default class NotificationList {
  pageNoAccessText = 'Only authenticated users can access this page';

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.root = page.getByTestId('notification-list');
  }
}
