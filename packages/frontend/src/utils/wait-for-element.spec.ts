import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForElementById } from './wait-for-element';

describe('waitForElementById', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('resolves with an element that is already there', async () => {
    document.body.innerHTML = '<div id="target"></div>';

    await expect(waitForElementById('target', 100)).resolves.toBe(
      document.getElementById('target'),
    );
  });

  it('resolves with an element rendered later, deep in the tree', async () => {
    document.body.innerHTML = '<main><section></section></main>';

    const found = waitForElementById('target', 1000);

    const el = document.createElement('div');
    el.id = 'target';
    document.querySelector('section')!.append(el);

    await expect(found).resolves.toBe(el);
  });

  it('resolves with null when the element never shows up', async () => {
    vi.useFakeTimers();

    const found = waitForElementById('target', 1000);

    vi.advanceTimersByTime(1000);

    await expect(found).resolves.toBeNull();
  });
});
