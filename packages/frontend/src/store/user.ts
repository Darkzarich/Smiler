import { defineStore } from 'pinia';
import { api } from '@/api';

interface User {
  id: string;
  login: string;
  avatar: string;
  rating: number;
  email: string;
  followersAmount: number;
  tagsFollowed: string[];
}

interface State {
  user: User | null;
}

export const useUserStore = defineStore('user', {
  state: (): State => ({
    user: null,
  }),
  getters: {
    userId(state) {
      return state.user?.id;
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
    clearUser() {
      this.user = null;
    },
    async userFetchAuthState() {
      try {
        const user = await api.auth.getAuth();

        if (user.isAuth) {
          this.user = user;
        }
      } catch {
        this.user = null;
      }
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
