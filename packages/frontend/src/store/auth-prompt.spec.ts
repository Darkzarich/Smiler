import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthPromptStore } from './auth-prompt';
import { useUserStore } from './user';

const user = {
  _id: '1',
  login: 'test',
  avatar: '',
  rating: 0,
  email: 'test@test.com',
  followersAmount: 0,
  tagsFollowed: [],
};

describe('Auth prompt store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('lets a signed in user through without opening the prompt', async () => {
    useUserStore().setUser(user);

    const store = useAuthPromptStore();

    await expect(
      store.ensureSignedIn({ title: 'Sign in to vote' }),
    ).resolves.toBe(true);
    expect(store.isOpen).toBe(false);
  });

  it('opens the prompt for a visitor, in the mode asked for', () => {
    const store = useAuthPromptStore();

    void store.ensureSignedIn({ title: 'Sign in to comment', mode: 'signup' });

    expect(store.isOpen).toBe(true);
    expect(store.title).toBe('Sign in to comment');
    expect(store.mode).toBe('signup');
  });

  it('resolves true once the visitor has signed in', async () => {
    const store = useAuthPromptStore();
    const result = store.ensureSignedIn({ title: 'Sign in to reply' });

    store.complete();

    await expect(result).resolves.toBe(true);
    expect(store.isOpen).toBe(false);
  });

  it('resolves false when the prompt is closed without signing in', async () => {
    const store = useAuthPromptStore();
    const result = store.ensureSignedIn({ title: 'Sign in to reply' });

    store.close();

    await expect(result).resolves.toBe(false);
  });

  it('dismisses a prompt that another one replaces', async () => {
    const store = useAuthPromptStore();
    const first = store.open({ title: 'Sign in to reply' });

    void store.open({ title: 'Sign in to vote' });

    await expect(first).resolves.toBe(false);
    expect(store.title).toBe('Sign in to vote');
  });

  it('starts in sign in mode unless asked otherwise', () => {
    const store = useAuthPromptStore();

    void store.open({ title: 'Sign in to comment', mode: 'signup' });
    store.close();
    void store.open({ title: 'Sign in to vote' });

    expect(store.mode).toBe('signin');
  });
});
