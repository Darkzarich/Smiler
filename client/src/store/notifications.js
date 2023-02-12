export default {
  state: {
    notifications: [],
  },
  getters: {

  },
  mutations: {
    pushSystemNotification(state, notif) {
      state.notifications.push(notif);
    },
    removeSystemNotification(state, timerId) {
      const notif = state.notifications.find((el) => el.timer === timerId);
      clearTimeout(notif.timer);
      state.notifications.splice(state.notifications.indexOf(notif), 1);
    },
  },
  actions: {
    newSystemNotification(context, payload) {
      const notif = {
        error: payload.error.message,
      };

      notif.timer = setTimeout(() => {
        context.commit('removeSystemNotification', notif.timer);
      }, 5000);

      context.commit('pushSystemNotification', notif);
    },
  },
};
