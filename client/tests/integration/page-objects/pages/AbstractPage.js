export default class AbstractPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  static formatTitle(name = 'Main') {
    return `${name} | Smiler`;
  }
}
