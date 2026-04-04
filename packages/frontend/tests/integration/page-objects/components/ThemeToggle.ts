import { type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
}

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
    const currentTheme = await this.page
      .locator('html')
      .getAttribute('color-scheme');

    return currentTheme as Theme;
  }

  async waitForThemeChange(theme: Theme) {
    await this.page.waitForFunction((theme) => {
      const html = window.document.getElementsByTagName('html')[0];
      return html.getAttribute('color-scheme') === theme;
    }, theme);
  }

  getOppositeTheme(theme: Theme) {
    return theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
  }

  async isPrefersDark() {
    return await this.page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
  }
}
