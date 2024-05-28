<template>
  <div class="notification-list" data-testid="notification-list">
    <TransitionGroup name="notification-list__item" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-list__item"
      >
        <div class="notification-list__item-message">
          {{ notification.message }}
        </div>

        <div
          class="notification-list__close"
          @click="removeNotification(notification.id)"
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
    removeNotification(id) {
      this.$store.commit('removeNotification', id);
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.notification-list {
  position: fixed;
  color: #fff;
  width: 100%;
  z-index: 999;
  top: 0;

  &__item {
    @include flex-row;

    height: 2rem;
    padding: 5px;
    align-items: center;
    justify-content: center;
    position: relative;
    border-bottom: 1px solid $bg;
    background: $error;
    opacity: 1;
    transition: opacity 0.2s 0s ease-in-out;

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
    text-wrap: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  &__close {
    position: absolute;
    right: 5px;
    top: 2px;
    cursor: pointer;

    svg {
      fill: $bg;
    }
  }
}
</style>
