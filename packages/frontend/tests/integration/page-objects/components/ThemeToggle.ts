import { type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

export default class ThemeToggle extends AbstractComponent {
  readonly toggle: Locator;
  readonly sunIcon: Locator;
  readonly moonIcon: Locator;

  constructor(page: Page) {
    super(page);
    this.toggle = page.getByTestId('theme-toggle');
    this.sunIcon = page.locator('.theme-toggle__icon svg');
    this.moonIcon = page.locator('.theme-toggle__icon svg');
  }

  async click() {
    await this.toggle.click();
  }

  async getCurrentTheme() {
    return await this.page.locator('html').getAttribute('color-scheme');
  }
}
