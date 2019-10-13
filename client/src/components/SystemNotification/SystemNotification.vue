<template>
  <div class="notifications">
    <transition-group name="notifications__item">
      <div
        class="notifications__item"
        v-for="notif in notifications"
        :key="notif.timer"
      >
        Error occured. {{ notif.error }}

        <div class="notifications__close" @click=closeNotification(notif.timer)>
          <exit-icon/>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import exitIcon from '@/library/svg/exit';

export default {
  components: {
    exitIcon,
  },
  computed: {
    ...mapState({
      notifications: state => state.notifications.notifications,
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

  .notifications {
    position: fixed;
    width: 100%;
    color: #fff;
    z-index: 999;
    top: 0;
    &__item {
      border-bottom: 1px solid $bg;
      background: $error;
      height: 2rem;
      opacity: 0.5;
      @include for-size(phone-only) {
        opacity: 1;
      }
      transition: opacity 0.2s 0s ease-in-out;
      &:hover {
        opacity: 1;
      }
      @include flex-row();
      align-items: center;
      justify-content: center;

      &-enter-active, &-leave-active {
        transition: all 0.3s;
      }

      &-enter, &-leave-to {
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
