import { afterEach, describe, expect, it } from 'vitest';
import { waitForElementById } from './wait-for-element';

describe('waitForElementById', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves with an element that is already there', async () => {
    document.body.innerHTML = '<div id="target"></div>';

    await expect(
      waitForElementById('target', new AbortController().signal),
    ).resolves.toBe(document.getElementById('target'));
  });

  it('resolves with an element rendered later, deep in the tree', async () => {
    document.body.innerHTML = '<main><section></section></main>';

    const found = waitForElementById('target', new AbortController().signal);

    const el = document.createElement('div');
    el.id = 'target';
    document.querySelector('section')!.append(el);

    await expect(found).resolves.toBe(el);
  });

  it('resolves with null once the signal aborts', async () => {
    const controller = new AbortController();

    const found = waitForElementById('target', controller.signal);

    controller.abort();

    await expect(found).resolves.toBeNull();
  });
});
