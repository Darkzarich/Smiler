import { expect } from '@playwright/test';
import AbstractPage from './AbstractPage';

export default class PostCreatePage extends AbstractPage {
  url = '/post/create';

  title = AbstractPage.formatTitle('Edit Post');

  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.header = page.getByTestId('post-create-header');

    this.postTitleInput = page.getByTestId('post-title-input');
    this.postTagInput = page.getByTestId('post-tag-input');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  getTagsList() {
    return this.page.getByTestId('post-tags-list');
  }

  getImageUploadBtn() {
    return this.page.getByTestId('image-upload-button');
  }

  getTextSection() {
    return this.page.getByTestId('text-section');
  }

  getPictureSection() {
    return this.page.getByTestId('pic-section');
  }

  getVideoSection() {
    return this.page.getByTestId('video-section');
  }

  getPostSectionsContainer() {
    return this.page.getByTestId('post-sections');
  }

  async addTag(tag = '') {
    await this.postTagInput.fill(tag);
    await this.page.keyboard.press('Enter');
  }

  async removeTag(tag = '') {
    await this.page.getByTestId(`remove-tag-button-${tag}`).click();
  }

  async addTextSection() {
    await this.page.getByTestId('add-text-button').click();
  }

  async addPictureSection() {
    await this.page.getByTestId('add-pic-button').click();
  }

  async addVideoSection() {
    await this.page.getByTestId('add-video-button').click();
  }

  async removeFirstSection() {
    await this.page
      .getByTestId(/delete-section/)
      .first()
      .click();
  }

  async removeLastSection() {
    await this.page
      .getByTestId(/delete-section/)
      .last()
      .click();
  }

  async fillTextSection(text = '') {
    await this.page.getByTestId('text-section-input').fill(text);
  }

  async uploadPictureWithUrl(url = '') {
    await this.page.getByTestId('image-url-input').fill(url);
    await this.getImageUploadBtn().click();
  }

  async uploadPictureWithFile() {
    await this.page.getByLabel('Upload image').setInputFiles({
      name: 'test.jpeg',
      buffer: Buffer.from('test', 'utf-8'),
      mimeType: 'image/jpeg',
    });

    await this.getImageUploadBtn().click();
  }

  async uploadVideoWithUrl(vidCode) {
    await this.page
      .getByTestId('video-url-input')
      .fill(`https://www.youtube.com/watch?v=${vidCode}`);
    await this.page.getByTestId('video-upload-button').click();
  }

  async submitPost() {
    await this.page.getByTestId('create-post-button').click();
  }

  async saveDraft() {
    await this.page.getByTestId('save-draft-button').click();
  }

  async awaitDragAndDropAnimation() {
    await this.page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="post-section"]');
      const computedStyle = window.getComputedStyle(element);
      console.log(computedStyle.opacity);
      return (
        computedStyle.opacity === '1' && computedStyle.transform === 'none'
      );
    });
  }

  async assertOldOrderOfSections() {
    const oldInnerHTML = await this.getPostSectionsContainer().innerHTML();
    // Text Section -> Pic Section order of sections
    expect(oldInnerHTML).toMatch(/text-section.*pic-section/);

    return async () => {
      const newInnerHTML = await this.getPostSectionsContainer().innerHTML();

      // Pic Section -> Text Section order of sections
      expect(newInnerHTML).toMatch(/pic-section.*text-section/);
    };
  }
}
