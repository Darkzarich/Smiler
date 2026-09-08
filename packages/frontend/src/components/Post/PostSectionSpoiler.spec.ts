import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import PostSectionSpoiler from './PostSectionSpoiler.vue';

const testId = 'section-veil';

const testElements = {
  veil: `[data-testid="${testId}"]`,
  content: `[data-testid="${testId}-content"]`,
};

function createWrapper(isSpoiler: boolean) {
  return mount(PostSectionSpoiler, {
    props: {
      isSpoiler,
      testId,
    },
    slots: {
      default: '<p data-testid="hidden-content">The butler did it</p>',
    },
  });
}

describe('PostSectionSpoiler', () => {
  it('renders the content without a veil when the section is not a spoiler', () => {
    const wrapper = createWrapper(false);

    expect(wrapper.find(testElements.veil).exists()).toBe(false);
    expect(
      wrapper.find(testElements.content).attributes('inert'),
    ).toBeUndefined();
    expect(wrapper.text()).toContain('The butler did it');
  });

  it('covers the content with a veil when the section is a spoiler', () => {
    const wrapper = createWrapper(true);

    expect(wrapper.find(testElements.veil).exists()).toBe(true);
    expect(
      wrapper.find(testElements.content).attributes('inert'),
    ).toBeDefined();
    expect(wrapper.find(testElements.content).attributes('aria-hidden')).toBe(
      'true',
    );
  });

  it('lifts the veil after the content is clicked', async () => {
    const wrapper = createWrapper(true);

    await wrapper.find(testElements.veil).trigger('click');

    expect(wrapper.find(testElements.veil).exists()).toBe(false);
    expect(
      wrapper.find(testElements.content).attributes('inert'),
    ).toBeUndefined();
  });
});
