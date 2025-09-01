import { defineStore } from 'pinia';

enum NotificationTheme {
  Info = 'info',
  Error = 'error',
}

interface Notification {
  id: string;
  theme: NotificationTheme;
  message: string;
  timer: number | NodeJS.Timeout; // timeout id
}

interface State {
  notifications: Notification[];
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): State => ({
    notifications: [],
  }),
  actions: {
    removeNotification(id: Notification['id']) {
      const notificationById = this.notifications.find(
        (notification) => notification.id === id,
      );

      if (!notificationById) {
        return;
      }

      clearTimeout(notificationById.timer);

      this.notifications = this.notifications.filter(
        (notification) => notification.id !== notificationById.id,
      );
    },
    showNotification(payload: Pick<Notification, 'theme' | 'message'>) {
      const notification: Notification = {
        id: crypto.randomUUID(),
        theme: payload.theme,
        message: payload.message,
        timer: setTimeout(() => {
          this.removeNotification(notification.id);
        }, 7000),
      };

      this.notifications.push(notification);
    },
    showInfoNotification(payload: Pick<Notification, 'message'>) {
      this.showNotification({
        theme: NotificationTheme.Info,
        message: payload.message,
      });
    },
    showErrorNotification(payload: Pick<Notification, 'message'>) {
      this.showNotification({
        theme: NotificationTheme.Error,
        message: payload.message,
      });
    },
  },
});
