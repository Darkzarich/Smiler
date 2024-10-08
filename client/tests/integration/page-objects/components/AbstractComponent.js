export default class AbstractComponent {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  findContextMenuOption(text = '') {
    return this.page
      .getByTestId('base-context-menu')
      .filter({ has: this.page.getByText(text) });
  }
}
