export default class PostEditor {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    this.textSectionInput = page.getByTestId('text-section-input');
  }

  async typeInTextSection(text) {
    await this.textSectionInput.focus();
    await this.page.keyboard.type(text);
  }

  async submitEditedPost() {
    await this.page.getByTestId('finish-edit-post-button').click();
  }
}
