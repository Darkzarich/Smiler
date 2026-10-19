import { expect, type Locator, type Page } from '@playwright/test';
import ConfirmModal from '../components/ConfirmModal';
import AbstractPage from './AbstractPage';

export default class PostCreatePage extends AbstractPage {
  readonly url = '/post/create';

  readonly header: Locator;
  readonly postTitleInput: Locator;
  readonly postTagInput: Locator;

  readonly title = AbstractPage.formatTitle('Edit Post');

  readonly confirmDeleteModal: ConfirmModal;

  constructor(page: Page) {
    super(page);

    this.header = page.getByTestId('post-create-header');

    this.postTitleInput = page.getByTestId('post-title-input');
    this.postTagInput = page.getByTestId('post-tag-input');
    this.confirmDeleteModal = new ConfirmModal(page, 'confirm-delete-modal');
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

  getPictureUploadLabel() {
    return this.page.getByTestId('picture-dropzone').locator('label');
  }

  getTextSection() {
    return this.page.getByTestId('text-section');
  }

  /** What the section holds, as opposed to the toolbar above it. */
  getTextSectionInput() {
    return this.page.getByTestId('text-section-input');
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

  getPostSection(index: number) {
    return this.page.getByTestId('post-section').nth(index);
  }

  /** The only place a section can be picked up from */
  getSectionGrip(index: number) {
    return this.getPostSection(index).getByTestId(/^section-grip-/);
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

  /** Choosing a file uploads it straight away — the Upload button next to it is
   * for a pasted URL only. */
  async uploadPictureWithFile() {
    await this.page.getByLabel('Upload image').setInputFiles({
      name: 'test.jpeg',
      buffer: Buffer.from('test', 'utf-8'),
      mimeType: 'image/jpeg',
    });
  }

  /** Playwright cannot drag a file in from outside the page, so the drop is
   * dispatched with a DataTransfer built in the page itself. */
  async dropPictureFile() {
    const dataTransfer = await this.page.evaluateHandle(() => {
      const data = new DataTransfer();

      data.items.add(new File(['test'], 'test.jpeg', { type: 'image/jpeg' }));

      return data;
    });

    await this.page
      .getByTestId('picture-dropzone')
      .dispatchEvent('drop', { dataTransfer });
  }

  async uploadVideoWithUrl(vidCode: string) {
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

      if (!element) {
        return false;
      }

      const computedStyle = window.getComputedStyle(element);

      return (
        computedStyle.opacity === '1' && computedStyle.transform === 'none'
      );
    });
  }

  /** From the first section's grip to the bottom of the second section, with
   * a mouse or, on a touch screen, a finger. */
  async dragFirstSectionAfterSecond({ touch = false } = {}) {
    // Just below the sticky site header, so as much of the second section as
    // possible is on screen to drop onto
    await this.getSectionGrip(0).evaluate((grip) => {
      window.scrollBy(0, grip.getBoundingClientRect().top - 100);
    });

    const gripBox = await this.getSectionGrip(0).boundingBox();
    const targetBox = await this.getPostSection(1).boundingBox();
    const viewport = this.page.viewportSize();

    if (!gripBox || !targetBox || !viewport) {
      throw new Error('Post section boxes are not available');
    }

    const from = {
      x: gripBox.x + gripBox.width / 2,
      y: gripBox.y + gripBox.height / 2,
    };
    const to = {
      x: from.x,
      y: Math.min(targetBox.y + targetBox.height - 8, viewport.height - 40),
    };

    if (touch) {
      await this.swipe(from, to);
    } else {
      await this.page.mouse.move(from.x, from.y);
      await this.page.mouse.down();
      await this.page.mouse.move(to.x, to.y, { steps: 20 });
      await this.page.mouse.up();
    }

    await this.awaitDragAndDropAnimation();
  }

  /** Playwright's touchscreen can only tap, so the finger is moved with raw
   * touch events. Chromium only. */
  async swipe(
    from: { x: number; y: number },
    to: { x: number; y: number },
    steps = 20,
  ) {
    const cdp = await this.page.context().newCDPSession(this.page);

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [from],
    });

    for (let step = 1; step <= steps; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: from.x + ((to.x - from.x) * step) / steps,
            y: from.y + ((to.y - from.y) * step) / steps,
          },
        ],
      });
    }

    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await cdp.detach();
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
