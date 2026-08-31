import { defineStore } from 'pinia';
import { api } from '@/api';
import type { authTypes } from '@/api/auth';

type User = Omit<authTypes.CurrentUser, 'isAuth'>;

interface State {
  user: User | null;
}

/** The app shell and the route guards both ask for the auth state as the page
 * loads; one request answers all of them */
let authStateRequest: Promise<void> | null = null;

export const useUserStore = defineStore('user', {
  state: (): State => ({
    user: null,
  }),
  getters: {
    userId(state) {
      return state.user?._id;
    },
    isTagFollowed(state) {
      const result: Record<string, string> = {};
      const user = state.user;

      if (!user) {
        return result;
      }

      user.tagsFollowed.forEach((tag) => {
        result[tag] = tag;
      });

      return result;
    },
  },
  actions: {
    setUser(user: User) {
      this.user = user;
    },
    clearUser() {
      this.user = null;
    },
    /** Bypasses the sharing above — go through `userFetchAuthState` instead */
    async loadAuthState() {
      try {
        const user = await api.auth.getAuth();

        if (user.isAuth) {
          this.setUser(user);
        } else {
          this.clearUser();
        }
      } catch {
        this.clearUser();
      }
    },
    async userFetchAuthState() {
      if (!authStateRequest) {
        authStateRequest = this.loadAuthState().finally(() => {
          authStateRequest = null;
        });
      }

      return authStateRequest;
    },
    followTag(tag: string) {
      if (this.user) {
        this.user.tagsFollowed.push(tag);
      }
    },
    unfollowTag(tag: string) {
      if (this.user) {
        const tagsFollowed = this.user.tagsFollowed;

        tagsFollowed.splice(tagsFollowed.indexOf(tag), 1);
      }
    },
    setAvatar(url: string) {
      if (this.user) {
        this.user.avatar = url;
      }
    },
  },
});
