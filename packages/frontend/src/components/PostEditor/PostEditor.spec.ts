import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import PostEditor from './PostEditor.vue';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { useUserStore } from '@/store/user';
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
  confirmModal: '[datatestid="delete-confirm-modal"]',
  deleteTextSection: '[data-testid="delete-section-text-1"]',
  deletePicSection: '[data-testid="delete-section-pic-1"]',
};

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
