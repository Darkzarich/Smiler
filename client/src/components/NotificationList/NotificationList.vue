<template>
  <div class="notification-list" data-testid="notification-list">
    <TransitionGroup name="notification-list__item" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-list__item"
        :class="{
          'notification-list__item--error': notification.theme === 'error',
          'notification-list__item--info': notification.theme === 'info',
        }"
      >
        <div class="notification-list__item-message">
          {{ notification.message }}
        </div>

        <div
          class="notification-list__close"
          @click="removeNotification(notification.id)"
        >
          <IconExit />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import IconExit from '@icons/IconExit.vue';

export default {
  components: {
    IconExit,
  },
  computed: {
    ...mapState({
      notifications: (state) => state.notifications.notifications,
    }),
  },
  methods: {
    removeNotification(id) {
      this.$store.commit('removeNotification', id);
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.notification-list {
  position: fixed;
  top: 0;
  z-index: 999;
  width: 100%;

  &__item {
    @include flex-row;

    justify-content: center;
    align-items: center;
    position: relative;
    opacity: 1;
    padding: 5px;
    border-bottom: 1px solid var(--color-bg);
    background: var(--color-error);
    transition: opacity 0.2s 0s ease-in-out;

    &--info {
      background: var(--color-dark-primary);
      color: var(--color-white);
    }

    &--error {
      background: var(--color-error);
      color: var(--color-white);
    }

    &-enter-active,
    &-leave-active {
      transition: all 0.3s;
    }

    &-enter,
    &-leave-to {
      opacity: 0;
      transform: translateY(15px);

      @include for-size(phone-only) {
        transform: translateY(-15px);
      }
    }
  }

  &__item-message {
    margin: 0 20px;
  }

  &__close {
    position: absolute;
    top: 2px;
    right: 5px;
    cursor: pointer;

    svg {
      fill: var(--color-bg);
    }
  }
}
</style>
