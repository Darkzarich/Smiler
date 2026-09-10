import { enableAutoUnmount, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Post from './Post.vue';
import { api } from '@/api';
import { postTypes } from '@/api/posts';

vi.mock('vue-router', async () => {
  const actual =
    await vi.importActual<typeof import('vue-router')>('vue-router');

  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      currentRoute: { value: { name: 'Home' } },
    }),
  };
});

vi.mock('@/api', () => ({
  api: {
    posts: {
      updateRateById: vi.fn(),
      removeRateById: vi.fn(),
      deletePostById: vi.fn(),
    },
    tags: {
      follow: vi.fn(),
      unfollow: vi.fn(),
    },
  },
}));

const POST_ID = 'post-1';

const testElements = {
  upvote: `[data-testid="post-${POST_ID}-upvote"]`,
  downvote: `[data-testid="post-${POST_ID}-downvote"]`,
  title: `[data-testid="post-${POST_ID}-title"]`,
  tag: `[data-testid="post-${POST_ID}-tag-news"]`,
};

function buildPost(): postTypes.Post {
  return {
    _id: POST_ID,
    slug: 'a-post',
    title: 'A post',
    tags: ['news'],
    sections: [
      {
        type: postTypes.POST_SECTION_TYPES.TEXT,
        hash: 'text-1',
        content: '<p>Body</p>',
      },
    ],
    author: { _id: 'user-1', login: 'tester', avatar: '' },
    commentCount: 0,
    rating: 0,
    rated: { isRated: false },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createWrapper(interactive: boolean) {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(Post, {
    props: {
      post: buildPost(),
      interactive,
      collapsible: false,
    },
    global: {
      plugins: [pinia],
      directives: { 'on-click-outside': {} },
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Post interactive prop', () => {
  enableAutoUnmount(afterEach);

  it('votes through the api when interactive', async () => {
    const wrapper = createWrapper(true);

    await wrapper.find(testElements.upvote).trigger('click');

    expect(api.posts.updateRateById).toHaveBeenCalledOnce();
  });

  it('does not vote when not interactive', async () => {
    const wrapper = createWrapper(false);

    await wrapper.find(testElements.upvote).trigger('click');
    await wrapper.find(testElements.downvote).trigger('click');

    expect(api.posts.updateRateById).not.toHaveBeenCalled();
    expect(api.posts.removeRateById).not.toHaveBeenCalled();
  });

  it('does not open the tag menu when not interactive', async () => {
    const wrapper = createWrapper(false);

    await wrapper.find(testElements.tag).trigger('click');

    expect(
      wrapper.findComponent({ name: 'BaseContextMenu' }).props('show'),
    ).toBe(false);
  });

  it('renders the title as plain text instead of a link when not interactive', () => {
    const interactiveWrapper = createWrapper(true);
    const inertWrapper = createWrapper(false);

    expect(interactiveWrapper.find(testElements.title).element.tagName).toBe(
      'A',
    );
    expect(inertWrapper.find(testElements.title).element.tagName).toBe('SPAN');
  });

  it('marks the vote column and footer inert when not interactive', () => {
    const wrapper = createWrapper(false);

    expect(wrapper.find('.post__left').attributes('inert')).toBeDefined();
    expect(wrapper.find('.post__meta-info').attributes('inert')).toBeDefined();
  });
});
