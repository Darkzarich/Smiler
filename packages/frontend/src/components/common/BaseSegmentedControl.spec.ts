import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BaseButton from './BaseButton.vue';
import BaseSegmentedControl from './BaseSegmentedControl.vue';

const options = [
  { value: 'write', label: 'Write', dataTestid: 'write-option' },
  { value: 'preview', label: 'Preview', dataTestid: 'preview-option' },
];

function createWrapper(modelValue: string) {
  return mount(BaseSegmentedControl, {
    props: { options, modelValue, label: 'Editor mode' },
  });
}

describe('BaseSegmentedControl', () => {
  enableAutoUnmount(afterEach);

  it('marks only the selected option as active', () => {
    const wrapper = createWrapper('write');

    expect(
      wrapper.findAllComponents(BaseButton).map((b) => b.props('active')),
    ).toEqual([true, false]);
  });

  it('emits the value of the option that was clicked', async () => {
    const wrapper = createWrapper('write');

    await wrapper.find('[data-testid="preview-option"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['preview']]);
  });

  it('tells assistive tech which option is pressed', () => {
    const wrapper = createWrapper('preview');

    expect(
      wrapper.find('[data-testid="preview-option"]').attributes('aria-pressed'),
    ).toBe('true');
  });
});
