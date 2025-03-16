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
    showNotification(context, payload) {
      const notification = {
        id: crypto.randomUUID(),
        theme: payload.theme,
        message: payload.message,
        timer: setTimeout(() => {
          context.commit('removeNotification', notification.id);
        }, 7000),
      };

      context.commit('pushNotification', notification);
    },
    showInfoNotification(context, payload) {
      context.dispatch('showNotification', {
        theme: 'info',
        message: payload.message,
      });
    },
    showErrorNotification(context, payload) {
      context.dispatch('showNotification', {
        theme: 'error',
        message: payload.message,
      });
    },
  },
};
