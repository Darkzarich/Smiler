<template>
  <div class="notification-list" data-testid="notification-list">
    <TransitionGroup name="notification-list__item" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-list__item u-flex-row"
        :class="{
          'notification-list__item--error': notification.theme === 'error',
          'notification-list__item--info': notification.theme === 'info',
        }"
      >
        <div class="notification-list__item-message">
          {{ notification.message }}
        </div>

        <div class="notification-list__close">
          <BaseIconButton
            label="Close notification"
            tone="inherit"
            @click="notificationsStore.removeNotification(notification.id)"
          >
            <IconClose />
          </BaseIconButton>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useNotificationsStore } from '@/store/notifications';
import BaseIconButton from '@common/BaseIconButton.vue';
import IconClose from '@icons/IconClose.vue';

const notificationsStore = useNotificationsStore();

const { notifications } = storeToRefs(notificationsStore);
</script>

<style>
.notification-list {
  position: fixed;
  top: 0;
  z-index: 999;
  width: 100%;

  &__item {
    justify-content: center;
    align-items: center;
    position: relative;
    opacity: 1;
    padding: 5px;
    border-bottom: 1px solid var(--color-surface-primary);
    background: var(--color-danger);
    transition: opacity 0.2s 0s ease-in-out;

    &--info {
      background: var(--color-primary-dark);
      color: #fff;
    }

    &--error {
      background: var(--color-danger);
      color: #fff;
    }

    &-enter-active,
    &-leave-active {
      transition: all 0.3s;
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: translateY(15px);

      @media (--phone-only) {
        transform: translateY(-15px);
      }
    }
  }

  /* Clears the 28px close button on both sides, so the text stays centered */
  &__item-message {
    margin: 0 36px;
  }

  &__close {
    position: absolute;
    top: 50%;
    right: 4px;
    transform: translateY(-50%);
  }
}
</style>
