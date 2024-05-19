<template>
  <div class="notification-list" data-testid="notification-list">
    <TransitionGroup name="notification-list__item">
      <div
        v-for="notification in notifications"
        :key="notification.timer"
        class="notification-list__item"
      >
        An error occurred. {{ notification.error }}

        <div
          class="notification-list__close"
          @click="closeNotification(notification.timer)"
        >
          <ExitIcon />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import ExitIcon from '@/library/svg/ExitIcon.vue';

export default {
  components: {
    ExitIcon,
  },
  computed: {
    ...mapState({
      notifications: (state) => state.notifications.notifications,
    }),
  },
  methods: {
    closeNotification(timer) {
      this.$store.commit('removeSystemNotification', timer);
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.notification-list {
  position: fixed;
  width: 100%;
  color: #fff;
  z-index: 999;
  top: 0;

  &__item {
    @include flex-row;

    border-bottom: 1px solid $bg;
    background: $error;
    height: 2rem;
    opacity: 0.5;
    transition: opacity 0.2s 0s ease-in-out;

    &:hover {
      opacity: 1;
    }

    @include for-size(phone-only) {
      opacity: 1;
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

  &__close {
    position: absolute;
    right: 1rem;
    cursor: pointer;

    svg {
      fill: $bg;
    }
  }
}
</style>
