import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref, type EffectScope } from 'vue';
import { useOwnVote } from './use-own-vote';
import { api } from '@/api';
import { useUserStore } from '@/store/user';

vi.mock('@/api', () => ({
  api: {
    posts: { getMyVotes: vi.fn() },
    comments: { getMyVotes: vi.fn() },
  },
}));

const user = {
  _id: 'user-1',
  login: 'test',
  avatar: '',
  rating: 0,
  email: 'test@test.com',
  followersAmount: 0,
  tagsFollowed: [],
};

interface Rated {
  isRated: boolean;
  negative?: boolean;
}

const notRated = (): Rated => ({ isRated: false });

let scope: EffectScope;

function watchItems(target: 'post' | 'comment', ids: string[]) {
  const items = ids.map((_id) => ref({ _id, rated: notRated() }));

  scope.run(() => items.forEach((item) => useOwnVote(target, item)));

  return items;
}

function watchItem(target: 'post' | 'comment', _id: string) {
  const item = ref({ _id, rated: notRated() });

  return { item, ...scope.run(() => useOwnVote(target, item))! };
}

describe('useOwnVote', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    scope = effectScope();
    vi.mocked(api.posts.getMyVotes).mockReset();
    vi.mocked(api.comments.getMyVotes).mockReset();
  });

  afterEach(() => {
    scope.stop();
  });

  it('asks for every item on screen in one request when the user signs in', async () => {
    vi.mocked(api.posts.getMyVotes).mockResolvedValue({
      a: { isRated: true, negative: false },
      b: { isRated: true, negative: true },
      c: { isRated: false },
    });

    const [a, b, c] = watchItems('post', ['a', 'b', 'c']);

    useUserStore().setUser(user);
    await flushPromises();

    expect(api.posts.getMyVotes).toHaveBeenCalledExactlyOnceWith([
      'a',
      'b',
      'c',
    ]);
    expect(api.comments.getMyVotes).not.toHaveBeenCalled();
    expect(a.value.rated).toEqual({ isRated: true, negative: false });
    expect(b.value.rated).toEqual({ isRated: true, negative: true });
    expect(c.value.rated).toEqual({ isRated: false });
  });

  it('splits more ids than the server takes into several requests', async () => {
    vi.mocked(api.comments.getMyVotes).mockResolvedValue({});

    const ids = Array.from({ length: 150 }, (_, i) => `comment-${i}`);

    watchItems('comment', ids);

    useUserStore().setUser(user);
    await flushPromises();

    expect(vi.mocked(api.comments.getMyVotes).mock.calls).toEqual([
      [ids.slice(0, 100)],
      [ids.slice(100)],
    ]);
  });

  it('clears the votes without a request when the user signs out', async () => {
    const userStore = useUserStore();

    userStore.setUser(user);

    const [item] = watchItems('post', ['a']);

    item.value.rated = { isRated: true, negative: false };

    userStore.clearUser();
    await flushPromises();

    expect(item.value.rated).toEqual({ isRated: false });
    expect(api.posts.getMyVotes).not.toHaveBeenCalled();
  });

  it('drops votes that arrive after the user has signed out again', async () => {
    let answer: (votes: Record<string, Rated>) => void = () => {};

    vi.mocked(api.posts.getMyVotes).mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    const userStore = useUserStore();
    const [item] = watchItems('post', ['a']);

    userStore.setUser(user);
    await flushPromises();
    userStore.clearUser();
    await flushPromises();
    answer({ a: { isRated: true } });
    await flushPromises();

    expect(item.value.rated).toEqual({ isRated: false });
  });

  it('leaves the items as they were when the request fails', async () => {
    vi.mocked(api.posts.getMyVotes).mockRejectedValue(new Error('offline'));

    const [item] = watchItems('post', ['a']);

    useUserStore().setUser(user);
    await flushPromises();

    expect(item.value.rated).toEqual({ isRated: false });
  });

  it('tells when an item shows the vote of the user who has just signed in', async () => {
    let answer: (votes: Record<string, Rated>) => void = () => {};

    vi.mocked(api.posts.getMyVotes).mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    const { item, whenOwnVoteShown } = watchItem('post', 'a');
    const onShown = vi.fn();

    useUserStore().setUser(user);
    void whenOwnVoteShown().then(() => onShown(item.value.rated));
    await flushPromises();

    expect(onShown).not.toHaveBeenCalled();

    answer({ a: { isRated: true, negative: false } });
    await flushPromises();

    expect(onShown).toHaveBeenCalledExactlyOnceWith({
      isRated: true,
      negative: false,
    });
  });
});
