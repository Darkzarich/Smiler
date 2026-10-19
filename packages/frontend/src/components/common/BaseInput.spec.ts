import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BaseInput from './BaseInput.vue';

describe('BaseInput', () => {
  enableAutoUnmount(afterEach);

  it('renders the icon-right slot and makes room for it', () => {
    const wrapper = mount(BaseInput, {
      slots: { 'icon-right': '<button data-testid="icon">Go</button>' },
    });

    expect(wrapper.find('[data-testid="icon"]').exists()).toBe(true);
    expect(wrapper.classes()).toContain('base-input--with-icon');
  });

  it('renders no icon container without the slot', () => {
    const wrapper = mount(BaseInput);

    expect(wrapper.find('.base-input__icon').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('base-input--with-icon');
  });
});
