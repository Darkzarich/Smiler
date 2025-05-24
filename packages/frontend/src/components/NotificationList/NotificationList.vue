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
          @click="notificationsStore.removeNotification(notification.id)"
        >
          <IconExit />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/store/notifications';
import IconExit from '@icons/IconExit.vue';

const notificationsStore = useNotificationsStore();

const { notifications } = storeToRefs(notificationsStore);
</script>

<style lang="scss">
@use '@/styles/mixins';

.notification-list {
  position: fixed;
  top: 0;
  z-index: 999;
  width: 100%;

  &__item {
    @include mixins.flex-row;

    justify-content: center;
    align-items: center;
    position: relative;
    opacity: 1;
    padding: 5px;
    border-bottom: 1px solid var(--color-bg);
    background: var(--color-danger);
    transition: opacity 0.2s 0s ease-in-out;

    &--info {
      background: var(--color-primary-dark);
      color: var(--color-white);
    }

    &--error {
      background: var(--color-danger);
      color: var(--color-white);
    }

    &-enter-active,
    &-leave-active {
      transition: all 0.3s;
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: translateY(15px);

      @include mixins.for-size(phone-only) {
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
