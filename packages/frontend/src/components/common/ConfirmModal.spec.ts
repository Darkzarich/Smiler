import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import ConfirmModal from './ConfirmModal.vue';

const testElements = {
  modal: '[data-testid="confirm-modal"]',
  panel: '[data-testid="confirm-modal-panel"]',
  backdrop: '[data-testid="confirm-modal-backdrop"]',
  confirm: '[data-testid="confirm-modal-confirm"]',
  cancel: '[data-testid="confirm-modal-cancel"]',
};

function createWrapper(props?: {
  isOpen?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}) {
  return mount(ConfirmModal, {
    props: {
      isOpen: false,
      title: 'Are you sure?',
      message: 'This action cannot be undone',
      ...props,
    },
    attachTo: document.body,
  });
}

let activeWrapper: ReturnType<typeof mount> | null = null;

afterEach(() => {
  activeWrapper?.unmount();
  activeWrapper = null;

  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

describe('ConfirmModal', () => {
  it('renders nothing when closed', async () => {
    activeWrapper = createWrapper({ isOpen: false });

    await nextTick();

    expect(document.body.querySelector(testElements.modal)).toBeNull();
  });

  it('renders title and message when open', async () => {
    activeWrapper = createWrapper({
      isOpen: true,
      title: 'Delete section?',
      message: 'All content will be lost',
    });

    await nextTick();

    const panel = document.body.querySelector(testElements.panel);

    expect(panel?.textContent).toContain('Delete section?');
    expect(panel?.textContent).toContain('All content will be lost');
  });

  it('emits confirm when the confirm button is clicked', async () => {
    activeWrapper = createWrapper({ isOpen: true });

    await nextTick();

    document.body
      .querySelector(testElements.confirm)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await nextTick();

    expect(activeWrapper.emitted('confirm')).toBeTruthy();
  });

  it('emits cancel when the cancel button is clicked', async () => {
    activeWrapper = createWrapper({ isOpen: true });

    await nextTick();

    document.body
      .querySelector(testElements.cancel)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await nextTick();

    expect(activeWrapper.emitted('cancel')).toBeTruthy();
  });

  it('emits cancel when the modal backdrop is clicked', async () => {
    activeWrapper = createWrapper({ isOpen: true });

    await nextTick();

    document.body
      .querySelector(testElements.backdrop)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await nextTick();

    expect(activeWrapper.emitted('cancel')).toBeTruthy();
  });

  it('renders custom button labels', async () => {
    activeWrapper = createWrapper({
      isOpen: true,
      confirmLabel: 'Delete',
      cancelLabel: 'Go back',
    });

    await nextTick();

    expect(document.body.querySelector(testElements.confirm)?.textContent).toBe(
      'Delete',
    );
    expect(document.body.querySelector(testElements.cancel)?.textContent).toBe(
      'Go back',
    );
  });
});
