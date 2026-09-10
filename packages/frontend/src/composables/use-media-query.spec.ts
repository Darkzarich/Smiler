import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { useMediaQuery } from './use-media-query';

const listeners = new Map<string, (event: MediaQueryListEvent) => void>();

beforeEach(() => {
  listeners.clear();

  window.matchMedia = vi.fn((media: string) => ({
    matches: false,
    media,
    addEventListener: (
      _: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => listeners.set(media, listener),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

describe('useMediaQuery', () => {
  it('resolves the breakpoint from media.css', () => {
    useMediaQuery('phone-only');

    expect(window.matchMedia).toHaveBeenCalledWith('(width < 600px)');
  });

  it('tracks the current match state', async () => {
    const isTabletPortraitUp = useMediaQuery('tablet-portrait-up');

    expect(isTabletPortraitUp.value).toBe(false);

    // VueUse attaches the change listener on the post-flush tick.
    await nextTick();

    const listener = listeners.get('(width >= 600px)');

    expect(listener).toBeDefined();

    listener?.({ matches: true } as MediaQueryListEvent);

    expect(isTabletPortraitUp.value).toBe(true);
  });

  it('reuses one listener per breakpoint', () => {
    expect(useMediaQuery('desktop-up')).toBe(useMediaQuery('desktop-up'));

    expect(window.matchMedia).toHaveBeenCalledTimes(1);
  });
});
