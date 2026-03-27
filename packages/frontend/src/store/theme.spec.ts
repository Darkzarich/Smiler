import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore, Theme } from './theme';

describe('Theme Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('initializes with system dark preference', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
    } as unknown as MediaQueryList);

    const store = useThemeStore();
    store.initTheme();
    expect(store.currentTheme).toBe('dark');
  });

  it('initializes with system light preference', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
    } as unknown as MediaQueryList);

    const store = useThemeStore();
    store.initTheme();
    expect(store.currentTheme).toBe('light');
  });

  it('loads saved theme from localStorage', () => {
    localStorage.setItem('app-theme', 'light');

    const store = useThemeStore();
    store.initTheme();
    expect(store.currentTheme).toBe('light');
  });

  it('toggles theme correctly', () => {
    const store = useThemeStore();
    store.currentTheme = Theme.DARK;
    store.toggleTheme();
    expect(store.currentTheme).toBe(Theme.LIGHT);
  });

  it('applies theme to HTML element', () => {
    const store = useThemeStore();
    store.currentTheme = Theme.LIGHT;
    store.applyTheme();
    expect(document.documentElement.getAttribute('color-scheme')).toBe('light');
  });
});
