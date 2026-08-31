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

  it('sends a single request when the auth state is asked for concurrently', async () => {
    // The app shell and the route guard of the landing route both ask on load
    const getAuth = vi
      .spyOn(api.auth, 'getAuth')
      .mockResolvedValue(authenticatedUser);

    const store = useUserStore();

    await Promise.all([store.userFetchAuthState(), store.userFetchAuthState()]);

    expect(getAuth).toHaveBeenCalledTimes(1);
    expect(store.user).toEqual(authenticatedUser);

    // The next ask is a fresh request, the previous one having settled
    await store.userFetchAuthState();

    expect(getAuth).toHaveBeenCalledTimes(2);
  });

  it('clears the user when the request fails', async () => {
    const store = useUserStore();
    store.user = authenticatedUser;

    vi.spyOn(api.auth, 'getAuth').mockRejectedValue(new Error('network'));

    await store.userFetchAuthState();

    expect(store.user).toBeNull();
  });
});
