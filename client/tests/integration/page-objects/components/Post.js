export default class Post {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {boolean} isMobile
   */
  constructor(page, isMobile) {
    this.page = page;
    this.isMobile = isMobile;
  }

  getTitleById(id) {
    return this.page.getByTestId(`post-${id}-title`);
  }
}
