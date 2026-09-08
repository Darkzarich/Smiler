import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Post from '../Post/Post.vue';
import PostEditor from './PostEditor.vue';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { useUserStore } from '@/store/user';
import BaseSegmentedControl from '@common/BaseSegmentedControl.vue';
import ConfirmModal from '@common/ConfirmModal.vue';

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/api', () => ({
  api: {
    users: {
      getMyTemplate: vi.fn(),
      removeFilePicSection: vi.fn(),
      updateMyTemplate: vi.fn(),
    },
    posts: {
      createPost: vi.fn(),
      updatePostById: vi.fn(),
    },
  },
}));

const testElements = {
  // After stub data-testid becomes datatestid
  confirmModal: '[datatestid="confirm-delete-modal"]',
  deleteTextSection: '[data-testid="delete-section-text-1"]',
  deletePicSection: '[data-testid="delete-section-pic-1"]',
  toggleTextSectionSpoiler: '[data-testid="toggle-spoiler-text-1"]',
  textSectionSpoilerBadge: '[data-testid="spoiler-badge-text-1"]',
  saveDraftButton: '[datatestid="save-draft-button"]',
  writeArea: '.post-editor__write',
  preview: '[datatestid="post-preview"]',
  previewEmpty: '[data-testid="post-preview-empty"]',
};

async function setMode(
  wrapper: ReturnType<typeof createWrapper>,
  mode: 'write' | 'preview',
) {
  await wrapper
    .findComponent(BaseSegmentedControl)
    .vm.$emit('update:modelValue', mode);

  await nextTick();
}

function textSection(content: string): postTypes.PostTextSection {
  return {
    type: postTypes.POST_SECTION_TYPES.TEXT,
    hash: 'text-1',
    content,
  };
}

function pictureSection(
  url: string,
  isFile = false,
): postTypes.PostPictureSection {
  return {
    type: postTypes.POST_SECTION_TYPES.PICTURE,
    hash: 'pic-1',
    url,
    isFile,
  };
}

function createWrapper(sections: postTypes.PostSection[], isEdit = false) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const userStore = useUserStore();
  userStore.user = {
    _id: 'user-1',
    login: 'tester',
    avatar: '',
    rating: 0,
    email: 'tester@example.com',
    followersAmount: 0,
    tagsFollowed: [],
  };

  vi.mocked(api.users.getMyTemplate).mockResolvedValue({
    title: '',
    sections,
    tags: [],
  });

  return mount(PostEditor, {
    props: {
      isEdit,
      post: null,
    },
    global: {
      plugins: [pinia],
      stubs: {
        Draggable: {
          name: 'Draggable',
          props: ['list', 'itemKey'],
          template: `
      <div>
        <template
          v-for="(item, index) in list"
          :key="item[itemKey] ?? index"
        >
          <slot name="item" :element="item" :index="index" />
        </template>
      </div>
    `,
        },
      },
    },
    attachTo: document.body,
    shallow: true,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PostEditor delete section flow', () => {
  enableAutoUnmount(afterEach);

  it('deletes an empty section immediately without showing the modal', async () => {
    const wrapper = createWrapper([textSection('')]);

    await flushPromises();

    await wrapper.find(testElements.deleteTextSection).trigger('click');
    await nextTick();

    const confirmModal = await wrapper.findComponent<typeof ConfirmModal>(
      testElements.confirmModal,
    );

    expect(wrapper.find(testElements.deleteTextSection).exists()).toBe(false);
    expect(confirmModal.props()).toMatchObject({
      isOpen: false,
    });
  });

  it('shows the confirm modal when deleting a section with content', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    await wrapper.find(testElements.deleteTextSection).trigger('click');
    await nextTick();

    const confirmModal = await wrapper.findComponent<typeof ConfirmModal>(
      testElements.confirmModal,
    );

    expect(wrapper.find(testElements.deleteTextSection).exists()).toBe(true);
    expect(confirmModal.props()).toMatchObject({
      isOpen: true,
    });
  });

  it('keeps the section when the deletion is declined', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    await wrapper.find(testElements.deleteTextSection).trigger('click');
    await nextTick();

    await wrapper.findComponent(ConfirmModal).vm.$emit('cancel');
    await nextTick();

    const confirmModal = await wrapper.findComponent<typeof ConfirmModal>(
      testElements.confirmModal,
    );

    expect(wrapper.find(testElements.deleteTextSection).exists()).toBe(true);
    expect(confirmModal.props()).toMatchObject({
      isOpen: false,
    });
  });

  it('deletes the section after the deletion is confirmed', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    await wrapper.find(testElements.deleteTextSection).trigger('click');
    await nextTick();

    await wrapper.findComponent(ConfirmModal).vm.$emit('confirm');
    await nextTick();

    const confirmModal = await wrapper.findComponent<typeof ConfirmModal>(
      testElements.confirmModal,
    );

    expect(wrapper.find(testElements.deleteTextSection).exists()).toBe(false);
    expect(confirmModal.props()).toMatchObject({
      isOpen: false,
    });
  });

  it('removes an uploaded picture file after deletion is confirmed', async () => {
    const wrapper = createWrapper([
      pictureSection('https://img.example.com/a.png', true),
    ]);

    await flushPromises();

    await wrapper.find(testElements.deletePicSection).trigger('click');
    await nextTick();

    await wrapper.findComponent(ConfirmModal).vm.$emit('confirm');
    await nextTick();

    expect(api.users.removeFilePicSection).toHaveBeenCalledWith('pic-1');
  });
});

describe('PostEditor spoiler flow', () => {
  it('marks a section as a spoiler and back', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    await wrapper.find(testElements.toggleTextSectionSpoiler).trigger('click');
    await nextTick();

    expect(wrapper.find(testElements.textSectionSpoilerBadge).exists()).toBe(
      true,
    );

    await wrapper.find(testElements.toggleTextSectionSpoiler).trigger('click');
    await nextTick();

    expect(wrapper.find(testElements.textSectionSpoilerBadge).exists()).toBe(
      false,
    );
  });

  it('sends the spoiler flag along with the section', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    vi.mocked(api.users.updateMyTemplate).mockResolvedValue({
      title: '',
      sections: [],
      tags: [],
    });

    await flushPromises();

    await wrapper.find(testElements.toggleTextSectionSpoiler).trigger('click');
    await nextTick();

    await wrapper.find(testElements.saveDraftButton).trigger('click');
    await flushPromises();

    expect(api.users.updateMyTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: [expect.objectContaining({ isSpoiler: true })],
      }),
    );
  });
});

describe('PostEditor preview', () => {
  it('opens in write mode', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    expect(wrapper.find(testElements.writeArea).isVisible()).toBe(true);
    expect(wrapper.find(testElements.preview).exists()).toBe(false);
  });

  it('renders the draft as a non-interactive post with nothing clipped', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    await setMode(wrapper, 'preview');

    const preview = wrapper.findComponent(Post);

    expect(wrapper.find(testElements.writeArea).isVisible()).toBe(false);
    expect(preview.props()).toMatchObject({
      interactive: false,
      collapsible: false,
    });
    expect(preview.props('post')).toMatchObject({
      sections: [expect.objectContaining({ content: 'Some content' })],
    });
  });

  it('stands in a placeholder title for an untitled draft', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    await setMode(wrapper, 'preview');

    expect(wrapper.findComponent(Post).props('post')).toMatchObject({
      title: 'Untitled post',
    });
  });

  it('shows an empty state instead of a post when there are no sections', async () => {
    const wrapper = createWrapper([]);

    await flushPromises();

    await setMode(wrapper, 'preview');

    expect(wrapper.find(testElements.preview).exists()).toBe(false);
    expect(wrapper.find(testElements.previewEmpty).exists()).toBe(true);
  });

  it('returns to the editor without losing the sections', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    await setMode(wrapper, 'preview');

    await setMode(wrapper, 'write');

    expect(wrapper.find(testElements.writeArea).isVisible()).toBe(true);
    expect(wrapper.find(testElements.preview).exists()).toBe(false);
    expect(wrapper.findAll('[data-testid="post-section"]')).toHaveLength(1);
  });
});
