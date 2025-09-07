import { type Page } from '@playwright/test';

export default class TagsList {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async addTag(tag = '') {
    await this.page.getByTestId('post-tag-input').fill(tag);
    await this.page.getByTestId('post-tag-input').press('Enter');
  }

  async addEachTag(tags: string[] = []) {
    for (const tag of tags) {
      // eslint-disable-next-line no-await-in-loop
      await this.addTag(tag);
    }
  }
}
