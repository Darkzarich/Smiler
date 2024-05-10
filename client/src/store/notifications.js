export default {
  state: {
    notifications: [],
  },
  getters: {},
  mutations: {
    pushSystemNotification(state, notification) {
      state.notifications.push(notification);
    },
    removeSystemNotification(state, timerId) {
      const notification = state.notifications.find(
        (el) => el.timer === timerId,
      );
      clearTimeout(notification.timer);
      state.notifications.splice(state.notifications.indexOf(notification), 1);
    },
  },
  actions: {
    newSystemNotification(context, payload) {
      const notification = {
        error: payload.error.message,
      };

      notification.timer = setTimeout(() => {
        context.commit('removeSystemNotification', notification.timer);
      }, 5000);

      context.commit('pushSystemNotification', notification);
    },
  },
};
