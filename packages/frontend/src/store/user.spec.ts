import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUserStore } from './user';
import { api } from '@/api';

const authenticatedUser = {
  isAuth: true as const,
  _id: '1',
  login: 'test',
  avatar: '',
  rating: 0,
  email: 'test@test.com',
  followersAmount: 0,
  tagsFollowed: [],
};

describe('User Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  it('stores the user when the session is authenticated', async () => {
    vi.spyOn(api.auth, 'getAuth').mockResolvedValue(authenticatedUser);

    const store = useUserStore();
    await store.userFetchAuthState();

    expect(store.user).toEqual(authenticatedUser);
  });

  it('clears a previously stored user when the session is gone', async () => {
    const store = useUserStore();
    store.user = authenticatedUser;

    // The API answers 200 with isAuth: false rather than 401, so the store
    // has to clear the user itself
    vi.spyOn(api.auth, 'getAuth').mockResolvedValue({ isAuth: false });

    await store.userFetchAuthState();

    expect(store.user).toBeNull();
  });

  it('clears the user when the request fails', async () => {
    const store = useUserStore();
    store.user = authenticatedUser;

    vi.spyOn(api.auth, 'getAuth').mockRejectedValue(new Error('network'));

    await store.userFetchAuthState();

    expect(store.user).toBeNull();
  });
});
