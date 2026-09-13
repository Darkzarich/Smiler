import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import BaseUploadForm from './BaseUploadForm.vue';

const isPointerCoarse = ref(false);

// The real composable caches one ref per breakpoint for the lifetime of the
// module, so the pointer kind has to be swapped here rather than through
// matchMedia.
vi.mock('@/composables/use-media-query', () => ({
  useMediaQuery: () => isPointerCoarse,
}));

async function createWrapper(props: Record<string, unknown> = {}) {
  const wrapper = mount(BaseUploadForm, { props, attachTo: document.body });

  // The drop zone binds its listeners once the template ref resolves.
  await nextTick();

  return wrapper;
}

function pick(wrapper: Awaited<ReturnType<typeof createWrapper>>, file: File) {
  const input = wrapper.find('input[type="file"]');

  Object.defineProperty(input.element, 'files', {
    configurable: true,
    value: [file],
  });

  return input.trigger('change');
}

/** jsdom has no DataTransfer, and a drag is only ever judged by the item types
 * it carries, so the parts `useDropZone` reads are stood in for here. */
function drag(target: Element, type: string, files: File[]) {
  const event = new Event(type, { bubbles: true });

  Object.defineProperty(event, 'dataTransfer', {
    value: {
      items: files.map((file) => ({ type: file.type })),
      files,
      dropEffect: '',
    },
  });

  target.dispatchEvent(event);

  return nextTick();
}

const picture = new File(['x'], 'picture.png', { type: 'image/png' });

const draggingClass = 'base-upload-form__label--dragging';
const quietClass = 'base-upload-form__label--dragging-quiet';

describe('BaseUploadForm', () => {
  enableAutoUnmount(afterEach);

  beforeEach(() => {
    isPointerCoarse.value = false;
  });

  it('emits the picked file', async () => {
    const wrapper = await createWrapper();

    await pick(wrapper, picture);

    expect(wrapper.emitted('select')).toEqual([[picture]]);
  });

  it('clears the input so the same file can be picked again', async () => {
    const wrapper = await createWrapper();

    await pick(wrapper, picture);

    expect(
      (wrapper.find('input[type="file"]').element as HTMLInputElement).value,
    ).toBe('');
  });

  it('emits nothing when the dialog is dismissed', async () => {
    const wrapper = await createWrapper();

    await wrapper.find('input[type="file"]').trigger('change');

    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('offers the drag instruction to a fine pointer', async () => {
    const wrapper = await createWrapper();

    expect(wrapper.text()).toContain('Drag & drop an image here');
  });

  it('offers a plain button to a coarse pointer', async () => {
    isPointerCoarse.value = true;

    const wrapper = await createWrapper();

    expect(wrapper.text()).toBe('Upload image');
  });

  it('emits the dropped file', async () => {
    const wrapper = await createWrapper();

    await drag(wrapper.element, 'drop', [picture]);

    expect(wrapper.emitted('select')).toEqual([[picture]]);
  });

  it('highlights itself while a file is dragged over it', async () => {
    const wrapper = await createWrapper();

    await drag(wrapper.element, 'dragenter', [picture]);

    expect(wrapper.find('label').classes()).toContain(draggingClass);
    expect(wrapper.find('label').classes()).not.toContain(quietClass);
    expect(wrapper.emitted('update:draggingOver')).toEqual([[true]]);
  });

  it('stands back and reports the drag when a host owns the zone', async () => {
    const host = document.createElement('div');

    document.body.appendChild(host);

    const wrapper = await createWrapper({ dropZone: host });

    await drag(host, 'dragenter', [picture]);

    expect(wrapper.find('label').classes()).toContain(quietClass);
    expect(wrapper.emitted('update:draggingOver')).toEqual([[true]]);

    await drag(host, 'drop', [picture]);

    expect(wrapper.emitted('select')).toEqual([[picture]]);

    host.remove();
  });

  it('ignores a drag carrying something it does not accept', async () => {
    const wrapper = await createWrapper({ accept: ['image/png'] });

    await drag(wrapper.element, 'dragenter', [
      new File(['x'], 'notes.txt', { type: 'text/plain' }),
    ]);

    expect(wrapper.find('label').classes()).not.toContain(draggingClass);
  });

  it('takes no drop on a coarse pointer', async () => {
    isPointerCoarse.value = true;

    const wrapper = await createWrapper();

    await drag(wrapper.element, 'drop', [picture]);

    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('takes no drop while it is disabled', async () => {
    const wrapper = await createWrapper({ disabled: true });

    await drag(wrapper.element, 'drop', [picture]);

    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('passes the accepted types on to the file dialog', async () => {
    const wrapper = await createWrapper({
      accept: ['image/png', 'image/gif'],
    });

    expect(wrapper.find('input[type="file"]').attributes('accept')).toBe(
      'image/png,image/gif',
    );
  });

  it('takes no file while it is disabled', async () => {
    const wrapper = await createWrapper({ disabled: true });

    expect(
      wrapper.find('input[type="file"]').attributes('disabled'),
    ).toBeDefined();
  });
});
