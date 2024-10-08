import api from '@/api';

export default {
  state: {
    id: -1,
    authState: false,
    login: '',
    avatar: '',
    rating: 0,
    followersAmount: 0,
    tagsFollowed: [],
    email: '',
  },
  getters: {
    isUserAuth(state) {
      return state.authState;
    },
    // Cache result to not recalculate every single time
    isTagFollowed(state) {
      const result = {};

      state.tagsFollowed.forEach((tag) => {
        result[tag] = tag;
      });

      return result;
    },
  },
  mutations: {
    setUser(state, user) {
      state.authState = user.isAuth;
      state.rating = user.rating;
      state.avatar = user.avatar;
      state.email = user.email;
      state.login = user.login;
      state.id = user.id;
      state.tagsFollowed = user.tagsFollowed;
      state.followersAmount = user.followersAmount || 0;
    },
    clearUser(state) {
      state.id = -1;
      state.authState = false;
      state.login = '';
      state.avatar = '';
      state.rating = 0;
      state.email = '';
      state.followersAmount = 0;
      state.tagsFollowed = [];
    },
    followTag(state, tag) {
      state.tagsFollowed.push(tag);
    },
    unfollowTag(state, tag) {
      state.tagsFollowed.splice(state.tagsFollowed.indexOf(tag), 1);
    },
    setAvatar(state, url) {
      state.avatar = url;
    },
  },
  actions: {
    async userGetAuthState(context) {
      const user = await api.auth.getAuth();

      if (user && user.data.isAuth) {
        context.commit('setUser', user.data);
      }
    },
  },
};
