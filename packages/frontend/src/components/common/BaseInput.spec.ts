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

  it('keeps its error hidden until the field is typed in', async () => {
    const wrapper = mount(BaseInput, { props: { error: 'Required' } });

    expect(wrapper.find('.base-input__error').exists()).toBe(false);
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('false');

    await wrapper.find('input').setValue('a');

    expect(wrapper.find('.base-input__error').text()).toBe('Required');
  });

  it('shows its error before it is typed in with showError', () => {
    const wrapper = mount(BaseInput, {
      props: { error: 'Required', showError: true },
    });
    const error = wrapper.find('.base-input__error');
    const input = wrapper.find('input');

    expect(error.text()).toBe('Required');
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(input.attributes('aria-describedby')).toBe(error.attributes('id'));
  });

  it('focuses its input through the exposed focus()', () => {
    const wrapper = mount(BaseInput, { attachTo: document.body });

    wrapper.vm.focus();

    expect(document.activeElement).toBe(wrapper.find('input').element);
  });
});
