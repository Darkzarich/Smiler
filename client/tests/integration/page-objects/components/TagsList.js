export default class TagsList {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async addTag(tag = '') {
    await this.page.getByTestId('post-tag-input').fill(tag);
    await this.page.getByTestId('post-tag-input').press('Enter');
  }

  async addEachTag(tags = []) {
    for (const tag of tags) {
      // eslint-disable-next-line no-await-in-loop
      await this.addTag(tag);
    }
  }
}
