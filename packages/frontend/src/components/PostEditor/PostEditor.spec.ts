import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import Post from '../Post/Post.vue';
import PostEditor from './PostEditor.vue';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import type { userTypes } from '@/api/users';
import { useUserStore } from '@/store/user';
import BaseInput from '@common/BaseInput.vue';
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
  createPostButton: '[datatestid="create-post-button"]',
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

function createWrapper(
  sections: postTypes.PostSection[],
  isEdit = false,
  template: Partial<userTypes.GetUserTemplateResponse> = {},
) {
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
    ...template,
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

enableAutoUnmount(afterEach);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PostEditor delete section flow', () => {
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

describe('PostEditor local draft', () => {
  const storageKey = 'post-draft:user-1';

  const storeLocalDraft = (draft: {
    title?: string;
    tags?: string[];
    sections?: postTypes.PostSection[];
    updatedAt: number;
  }) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ title: '', tags: [], sections: [], ...draft }),
    );
  };

  const titleOf = (wrapper: ReturnType<typeof createWrapper>) =>
    wrapper.findComponent(BaseInput).props('modelValue');

  const readStoredDraft = () => {
    const stored = localStorage.getItem(storageKey);

    return stored ? JSON.parse(stored) : null;
  };

  afterEach(() => {
    localStorage.clear();
  });

  it("opens the draft this device holds when it is newer than the account's", async () => {
    storeLocalDraft({
      title: 'Written here',
      sections: [textSection('Local content')],
      updatedAt: Date.parse('2026-09-13T12:00:00.000Z'),
    });

    const wrapper = createWrapper([textSection('Account content')], false, {
      title: 'Saved to the account',
      updatedAt: '2026-09-13T11:00:00.000Z',
    });

    await flushPromises();

    expect(titleOf(wrapper)).toBe('Written here');
    expect(wrapper.findAll('[data-testid="post-section"]')).toHaveLength(1);
  });

  it('opens the account template when it is the newer of the two', async () => {
    storeLocalDraft({
      title: 'Written here',
      updatedAt: Date.parse('2026-09-13T10:00:00.000Z'),
    });

    const wrapper = createWrapper([textSection('Account content')], false, {
      title: 'Saved to the account',
      updatedAt: '2026-09-13T11:00:00.000Z',
    });

    await flushPromises();

    expect(titleOf(wrapper)).toBe('Saved to the account');
  });

  it('leaves a restored local draft marked as not yet saved to the account', async () => {
    storeLocalDraft({
      title: 'Written here',
      updatedAt: Date.parse('2026-09-13T12:00:00.000Z'),
    });

    const wrapper = createWrapper([], false, {
      updatedAt: '2026-09-13T11:00:00.000Z',
    });

    await flushPromises();

    expect(
      wrapper.find(testElements.saveDraftButton).attributes('disabled'),
    ).toBe('false');
  });

  it('counts a restored draft that only repeats the account copy as saved', async () => {
    storeLocalDraft({
      title: 'The same title',
      sections: [textSection('The same content')],
      updatedAt: Date.parse('2026-09-13T12:00:00.000Z'),
    });

    const wrapper = createWrapper([textSection('The same content')], false, {
      title: 'The same title',
      updatedAt: '2026-09-13T11:00:00.000Z',
    });

    await flushPromises();

    expect(
      wrapper.find(testElements.saveDraftButton).attributes('disabled'),
    ).toBe('true');
  });

  it('writes the editor contents to this device as they change', async () => {
    vi.useFakeTimers();

    try {
      const wrapper = createWrapper([textSection('Account content')]);

      await flushPromises();

      await wrapper
        .findComponent(BaseInput)
        .vm.$emit('update:modelValue', 'A title typed out');

      vi.advanceTimersByTime(1000);
      await flushPromises();

      expect(readStoredDraft()).toMatchObject({
        title: 'A title typed out',
        sections: [expect.objectContaining({ content: 'Account content' })],
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('drops this device copy once the draft reaches the account', async () => {
    storeLocalDraft({
      title: 'Written here',
      updatedAt: Date.parse('2026-09-13T12:00:00.000Z'),
    });

    const wrapper = createWrapper([textSection('Some content')], false, {
      updatedAt: '2026-09-13T11:00:00.000Z',
    });

    vi.mocked(api.users.updateMyTemplate).mockResolvedValue({
      title: 'Written here',
      sections: [textSection('Some content')],
      tags: [],
      updatedAt: '2026-09-13T13:00:00.000Z',
    });

    await flushPromises();

    await wrapper.find(testElements.saveDraftButton).trigger('click');
    await flushPromises();

    expect(readStoredDraft()).toBeNull();
  });

  it('drops this device copy once the post is published', async () => {
    storeLocalDraft({
      title: 'Written here',
      updatedAt: Date.parse('2026-09-13T12:00:00.000Z'),
    });

    const wrapper = createWrapper([textSection('Some content')], false, {
      title: 'A title',
      updatedAt: '2026-09-13T11:00:00.000Z',
    });

    vi.mocked(api.posts.createPost).mockResolvedValue({
      slug: 'a-post',
    } as Awaited<ReturnType<typeof api.posts.createPost>>);

    await flushPromises();

    await wrapper.find(testElements.createPostButton).trigger('click');
    await flushPromises();

    expect(readStoredDraft()).toBeNull();
  });
});

describe('PostEditor unsaved changes warning', () => {
  const closeTab = () => {
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    return event;
  };

  afterEach(() => {
    localStorage.clear();
  });

  it('lets the tab close while everything is saved to the account', async () => {
    createWrapper([textSection('Some content')]);

    await flushPromises();

    expect(closeTab().defaultPrevented).toBe(false);
  });

  it('asks before the tab closes on changes the account has not seen', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    await flushPromises();

    await wrapper
      .findComponent(BaseInput)
      .vm.$emit('update:modelValue', 'A title typed out');
    await nextTick();

    expect(closeTab().defaultPrevented).toBe(true);
  });

  it('lets the tab close again once the draft reaches the account', async () => {
    const wrapper = createWrapper([textSection('Some content')]);

    vi.mocked(api.users.updateMyTemplate).mockResolvedValue({
      title: 'A title typed out',
      sections: [textSection('Some content')],
      tags: [],
    });

    await flushPromises();

    await wrapper
      .findComponent(BaseInput)
      .vm.$emit('update:modelValue', 'A title typed out');
    await nextTick();

    await wrapper.find(testElements.saveDraftButton).trigger('click');
    await flushPromises();
    await nextTick();

    expect(closeTab().defaultPrevented).toBe(false);
  });
});
