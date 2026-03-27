import { defineStore } from 'pinia';

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
}

interface ThemeState {
  currentTheme: Theme;
}

const STORAGE_KEY = 'app-theme';

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    currentTheme: Theme.DARK,
  }),

  actions: {
    initTheme() {
      const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;

      if (
        savedTheme &&
        (savedTheme === Theme.DARK || savedTheme === Theme.LIGHT)
      ) {
        this.currentTheme = savedTheme;
      } else {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)',
        ).matches;
        this.currentTheme = prefersDark ? Theme.DARK : Theme.LIGHT;
      }

      this.applyTheme();
    },

    toggleTheme() {
      this.currentTheme =
        this.currentTheme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
      this.saveTheme();
      this.applyTheme();
    },

    setTheme(theme: Theme) {
      this.currentTheme = theme;
      this.saveTheme();
      this.applyTheme();
    },

    saveTheme() {
      localStorage.setItem(STORAGE_KEY, this.currentTheme);
    },

    applyTheme() {
      document.documentElement.setAttribute('color-scheme', this.currentTheme);
    },
  },
});
