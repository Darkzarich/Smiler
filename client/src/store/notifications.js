export default {
  state: {
    notifications: [],
  },
  getters: {},
  mutations: {
    pushNotification(state, notification) {
      state.notifications.push(notification);
    },
    removeNotification(state, id) {
      const notification = state.notifications.find((el) => el.id === id);

      clearTimeout(notification.timer);

      state.notifications = state.notifications.filter(
        (el) => el !== notification,
      );
    },
  },
  actions: {
    newNotification(context, payload) {
      const notification = {
        id: crypto.randomUUID(),
        message: payload.message,
        timer: setTimeout(() => {
          context.commit('removeNotification', notification.id);
        }, 10000),
      };

      context.commit('pushNotification', notification);
    },
  },
};
