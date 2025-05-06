import { defineStore } from 'pinia';
import api from '@/api';

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
      const res = await api.auth.getAuth();

      if (res?.data?.isAuth) {
        this.user = res.data;
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
