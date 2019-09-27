import api from '@/api';

export default {
  state: {
    authState: false,
    login: '',
    avatar: '',
    rating: 0,
    email: '',
  },
  getters: {
    getUser(state) {
      return state;
    },
    getUserAuthState(state) {
      return state.authState;
    },
  },
  mutations: {
    setUser(state, user) {
      state.authState = user.isAuth;
      state.rating = user.rating;
      state.avatar = user.avatar;
      state.email = user.email;
      state.login = user.login;
    },
    clearUser(state) {
      state.authState = false;
      state.login = '';
      state.avatar = '';
      state.rating = 0;
      state.email = '';
    },
  },
  actions: {
    async userCheckAuthState(context) {
      const user = await api.users.checkAuthState();

      if (user.data.isAuth) {
        context.commit('setUser', user.data);
      }
    },
  },
};
