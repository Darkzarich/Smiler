import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BaseTag from './BaseTag.vue';

describe('BaseTag', () => {
  enableAutoUnmount(afterEach);

  it('is plain text by default, so a tag that does nothing is not a tab stop', () => {
    const wrapper = mount(BaseTag, { slots: { default: 'vue' } });

    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.text()).toBe('vue');
  });

  it('is a plain button when interactive, so it never submits a surrounding form', () => {
    const wrapper = mount(BaseTag, {
      props: { interactive: true },
      slots: { default: 'vue' },
    });

    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('type')).toBe('button');
  });
});
