<template>
  <div class="mobile-menu">
    <div class="mobile-menu__close-btn" @click="closeMenu()">
      <ExitIcon />
    </div>

    <CurrentUser class="mobile-menu__user" />

    <Navigation
      nav-link-class="mobile-menu__nav-link"
      class="mobile-menu__navigation"
    >
      <template #before>
        <NavigationFeedLink class="mobile-menu__nav-link" />
      </template>
    </Navigation>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Navigation from '../Navigation/Navigation.vue';
import NavigationFeedLink from '../Navigation/NavigationFeedLink.vue';
import CurrentUser from '@/components/User/CurrentUser.vue';
import ExitIcon from '@/library/svg/ExitIcon.vue';

export default {
  components: {
    CurrentUser,
    ExitIcon,
    Navigation,
    NavigationFeedLink,
  },
  computed: {
    ...mapGetters(['isUserAuth']),
  },
  methods: {
    closeMenu() {
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';
@import '@/styles/colors';

.mobile-menu {
  position: fixed;
  background: $widget-bg;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow-y: scroll;
  z-index: 1000;

  &__close-btn {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;

    svg {
      fill: $error;
    }
  }

  &__navigation {
    @include flex-col;

    overflow-x: hidden;
  }

  &__nav-link {
    width: 100%;
    padding: 1rem;
    border-bottom: 1px solid $light-gray;

    &:first-child {
      border-top: 1px solid $light-gray;
    }
  }

  &__user {
    border: none;
  }
}
</style>
