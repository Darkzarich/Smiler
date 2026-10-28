import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BaseIconButton from './BaseIconButton.vue';

function createWrapper(props: {
  label: string;
  pressed?: boolean;
  shortcut?: string;
}) {
  return mount(BaseIconButton, {
    props,
    slots: { default: '<svg />' },
  });
}

describe('BaseIconButton', () => {
  enableAutoUnmount(afterEach);

  it('names the button with its label', () => {
    const wrapper = createWrapper({ label: 'Delete post' });

    expect(wrapper.attributes('aria-label')).toBe('Delete post');
    expect(wrapper.attributes('title')).toBe('Delete post');
  });

  it('is a plain button, so it never submits a surrounding form', () => {
    const wrapper = createWrapper({ label: 'Search' });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('only announces a pressed state when it is a toggle', () => {
    expect(
      createWrapper({ label: 'Search' }).attributes('aria-pressed'),
    ).toBeUndefined();
    expect(
      createWrapper({ label: 'Upvote', pressed: false }).attributes(
        'aria-pressed',
      ),
    ).toBe('false');
    expect(
      createWrapper({ label: 'Upvote', pressed: true }).attributes(
        'aria-pressed',
      ),
    ).toBe('true');
  });

  it('shows its shortcut in the tooltip and announces it, leaving the name alone', () => {
    // jsdom's navigator is no Apple device's
    const wrapper = createWrapper({ label: 'Bold', shortcut: 'Mod-b' });

    expect(wrapper.attributes('aria-label')).toBe('Bold');
    expect(wrapper.attributes('title')).toBe('Bold (Ctrl+B)');
    expect(wrapper.attributes('aria-keyshortcuts')).toBe('Control+B');
  });
});
