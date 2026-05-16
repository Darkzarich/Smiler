import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import CollapsibleContent from './CollapsibleContent.vue';

const testElements = {
  body: '[data-testid="collapsible-content-body"]',
  fade: '[data-testid="collapsible-content-fade"]',
  toggle: '[data-testid="collapsible-content-toggle"]',
};

class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function createWrapper(
  slotHeight: number,
  props?: { maxHeight?: number; disabled?: boolean },
) {
  return mount(CollapsibleContent, {
    props: {
      maxHeight: props?.maxHeight ?? 100,
      disabled: props?.disabled ?? false,
    },
    slots: {
      default: `<div style="height: ${slotHeight}px">content</div>`,
    },
    attachTo: document.body,
  });
}

function mockScrollHeight(wrapper: ReturnType<typeof mount>, height: number) {
  const el = wrapper.find(testElements.body).element as HTMLElement;
  Object.defineProperty(el, 'scrollHeight', {
    value: height,
    configurable: true,
  });
}

describe('CollapsibleContent', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  function createAndMeasure(
    slotHeight: number,
    props?: { maxHeight?: number; disabled?: boolean },
  ) {
    const wrapper = createWrapper(slotHeight, props);
    mockScrollHeight(wrapper, slotHeight);
    const vm = wrapper.vm as unknown as { measure: () => void };
    vm.measure();
    return wrapper;
  }

  it('does not collapse when content fits within maxHeight', async () => {
    const wrapper = createAndMeasure(80, { maxHeight: 100 });
    await nextTick();

    const body = wrapper.find(testElements.body);

    expect(body.exists()).toBe(true);
    expect(body.classes()).not.toEqual(
      expect.arrayContaining([expect.stringContaining('--collapsed')]),
    );
    expect(wrapper.find(testElements.fade).exists()).toBe(false);
    expect(wrapper.find(testElements.toggle).exists()).toBe(false);
  });

  it('collapses when content exceeds maxHeight', async () => {
    const wrapper = createAndMeasure(200, { maxHeight: 100 });
    await nextTick();

    const body = wrapper.find(testElements.body);

    expect(body.exists()).toBe(true);
    expect(body.classes()).toEqual(
      expect.arrayContaining([expect.stringContaining('--collapsed')]),
    );
    expect(wrapper.find(testElements.fade).exists()).toBe(true);
    expect(wrapper.find(testElements.toggle).text()).toBe('Read more');
  });

  it('expands when Read more is clicked', async () => {
    const wrapper = createAndMeasure(200, { maxHeight: 100 });
    await nextTick();

    await wrapper.find(testElements.toggle).trigger('click');
    await nextTick();

    const body = wrapper.find(testElements.body);

    expect(body.classes()).not.toEqual(
      expect.arrayContaining([expect.stringContaining('--collapsed')]),
    );
    expect(wrapper.find(testElements.fade).exists()).toBe(false);
    expect(wrapper.find(testElements.toggle).text()).toBe('Show less');
  });

  it('re-collapses when Show less is clicked', async () => {
    const wrapper = createAndMeasure(200, { maxHeight: 100 });
    await nextTick();

    await wrapper.find(testElements.toggle).trigger('click');
    await nextTick();
    await wrapper.find(testElements.toggle).trigger('click');
    await nextTick();

    const body = wrapper.find(testElements.body);

    expect(body.classes()).toEqual(
      expect.arrayContaining([expect.stringContaining('--collapsed')]),
    );
    expect(wrapper.find(testElements.toggle).text()).toBe('Read more');
  });

  it('does not collapse when disabled prop is true', async () => {
    const wrapper = createWrapper(200, { maxHeight: 100, disabled: true });
    mockScrollHeight(wrapper, 200);
    await nextTick();

    const body = wrapper.find(testElements.body);

    expect(body.classes()).not.toEqual(
      expect.arrayContaining([expect.stringContaining('--collapsed')]),
    );
    expect(wrapper.find(testElements.fade).exists()).toBe(false);
    expect(wrapper.find(testElements.toggle).exists()).toBe(false);
  });
});
