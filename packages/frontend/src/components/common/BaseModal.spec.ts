import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import BaseModal from './BaseModal.vue';

const testElements = {
  modal: '[data-testid="base-modal"]',
  panel: '[data-testid="base-modal-panel"]',
  backdrop: '[data-testid="base-modal-backdrop"]',
};

function modalInDom(): HTMLElement | null {
  return document.body.querySelector(testElements.modal);
}

function panelInDom(): HTMLElement | null {
  return document.body.querySelector(testElements.panel);
}

function createWrapper(
  props?: { isOpen?: boolean; closeOnBackdrop?: boolean; closeOnEsc?: boolean },
  slots?: Record<string, string>,
) {
  activeWrapper = mount(BaseModal, {
    props: {
      isOpen: false,
      ...props,
    },
    slots,
    attachTo: document.body,
  });

  return activeWrapper;
}

let activeWrapper: ReturnType<typeof mount> | null = null;

afterEach(() => {
  activeWrapper?.unmount();
  activeWrapper = null;

  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('BaseModal', () => {
  it('renders nothing when closed', async () => {
    createWrapper({ isOpen: false }, { default: '<p>content</p>' });

    await nextTick();

    expect(modalInDom()).toBeNull();
  });

  it('renders content when open', async () => {
    createWrapper({ isOpen: true }, { default: '<p>modal content</p>' });

    await nextTick();

    expect(modalInDom()).not.toBeNull();
    expect(panelInDom()?.textContent).toContain('modal content');
  });

  it('renders header and footer slots', async () => {
    createWrapper(
      { isOpen: true },
      {
        header: '<h2>Header</h2>',
        default: '<p>body</p>',
        footer: '<footer>Footer</footer>',
      },
    );

    await nextTick();

    const panel = panelInDom();

    expect(panel?.querySelector('h2')?.textContent).toBe('Header');
    expect(panel?.querySelector('footer')?.textContent).toBe('Footer');
  });

  it('emits close when the backdrop is clicked', async () => {
    const wrapper = createWrapper({ isOpen: true });

    await nextTick();

    modalInDom()
      ?.querySelector(testElements.backdrop)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await nextTick();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not emit close when the panel itself is clicked', async () => {
    const wrapper = createWrapper({ isOpen: true });

    await nextTick();

    modalInDom()
      ?.querySelector(testElements.panel)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await nextTick();

    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('does not emit close on backdrop click when closeOnBackdrop is false', async () => {
    const wrapper = createWrapper({ isOpen: true, closeOnBackdrop: false });

    await nextTick();

    modalInDom()
      ?.querySelector(testElements.backdrop)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await nextTick();

    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('emits close on Escape keydown', async () => {
    const wrapper = createWrapper({ isOpen: true });

    await nextTick();

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );

    await nextTick();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not emit close on Escape when closeOnEsc is false', async () => {
    const wrapper = createWrapper({ isOpen: true, closeOnEsc: false });

    await nextTick();

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );

    await nextTick();

    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('locks body scroll while open', async () => {
    createWrapper({ isOpen: true });

    await nextTick();

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll on close', async () => {
    const wrapper = createWrapper({ isOpen: true });

    await nextTick();

    await wrapper.setProps({ isOpen: false });
    await nextTick();

    expect(document.body.style.overflow).toBe('');
  });
});
