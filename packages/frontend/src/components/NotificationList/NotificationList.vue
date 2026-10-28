<template>
  <div class="notification-list" data-testid="notification-list">
    <TransitionGroup name="notification-list__item" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-list__item u-flex-row"
        :role="notification.theme === 'error' ? 'alert' : 'status'"
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
  top: var(--header-height);
  right: 0;
  left: 0;

  /* Above BaseModal, so the error from a modal's own request (a wrong
     password) is not dimmed by its backdrop */
  z-index: 1001;
  width: min(100% - 2 * var(--page-gutter), var(--page-max-width));

  /* The header's bottom edge, so a bar slides out from behind the header */
  overflow: clip;
  margin-inline: auto;

  @media (--tablet-portrait-up) {
    border-radius: 0 0 8px 8px;
  }

  &__item {
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 0.5rem;
    color: var(--color-text-on-fill);

    & + & {
      border-top: 1px solid var(--color-surface-primary);
    }

    &--info {
      background: var(--color-primary-fill);
    }

    &--error {
      background: var(--color-danger-fill);
    }

    /* Behind the bar above, so it slides out from under that one too */
    &-enter-active,
    &-leave-active {
      z-index: -1;
      transition:
        opacity 0.3s,
        transform 0.3s;
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: translateY(-100%);

      @media (prefers-reduced-motion: reduce) {
        transform: none;
      }
    }
  }

  /* Clears the 28px close button on both sides, so the text stays centered */
  &__item-message {
    margin: 0 36px;
  }

  &__close {
    display: flex;
    position: absolute;
    top: 50%;
    right: 4px;
    transform: translateY(-50%);

    /* Inside the button: the list clips anything past the bar, and the green
       ring would not show on the green info bar */
    & :focus-visible {
      outline-color: currentcolor;
      outline-offset: -2px;
    }
  }
}
</style>
