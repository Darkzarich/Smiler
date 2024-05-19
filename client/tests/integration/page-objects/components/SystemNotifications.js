export default class SystemNotifications {
  pageNoAccessText = 'Only authenticated users can access this page';

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.list = page.getByTestId('system-notifications');
  }
}
