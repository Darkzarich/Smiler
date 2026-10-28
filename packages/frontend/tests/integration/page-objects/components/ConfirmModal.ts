import { expect, type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

export default class ConfirmModal extends AbstractComponent {
  readonly root: Locator;
  readonly panel: Locator;
  readonly confirmBtn: Locator;
  readonly cancelBtn: Locator;

  constructor(page: Page, dataTestid = 'confirm-modal') {
    super(page);

    this.root = page.getByTestId(dataTestid);
    this.panel = page.getByTestId(`${dataTestid}-panel`);
    this.confirmBtn = page.getByTestId(`${dataTestid}-confirm`);
    this.cancelBtn = page.getByTestId(`${dataTestid}-cancel`);
  }

  async confirm() {
    await this.confirmBtn.click();
  }

  async cancel() {
    await this.cancelBtn.click();
  }

  async expectVisible() {
    await expect(this.panel).toBeVisible();
  }

  async expectHidden() {
    await expect(this.root).toBeHidden();
  }
}
