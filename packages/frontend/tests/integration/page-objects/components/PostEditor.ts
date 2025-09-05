import { type Locator, type Page } from '@playwright/test';

export default class PostEditor {
  readonly page: Page;
  readonly textSectionInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.textSectionInput = page.getByTestId('text-section-input');
  }

  async typeInTextSection(text: string) {
    await this.textSectionInput.focus();
    await this.page.keyboard.type(text);
  }

  async submitEditedPost() {
    await this.page.getByTestId('finish-edit-post-button').click();
  }
}
