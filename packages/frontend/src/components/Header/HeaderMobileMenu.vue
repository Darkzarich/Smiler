<template>
  <div class="mobile-menu">
    <div class="mobile-menu__close-btn" @click="closeMenu()">
      <IconExit />
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
import Navigation from '@components/Navigation/Navigation.vue';
import NavigationFeedLink from '@components/Navigation/NavigationFeedLink.vue';
import CurrentUser from '@components/User/CurrentUser.vue';
import IconExit from '@icons/IconExit.vue';

export default {
  components: {
    CurrentUser,
    IconExit,
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

.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  background: var(--color-widget-bg);
  overflow-y: scroll;

  &__close-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;

    svg {
      fill: var(--color-danger);
    }
  }

  &__navigation {
    @include flex-col;

    overflow-x: hidden;
  }

  &__nav-link {
    width: 100%;
    padding: 1rem;
    border-bottom: 1px solid var(--color-gray-light);

    &:first-child {
      border-top: 1px solid var(--color-gray-light);
    }
  }

  &__user {
    border: none;
  }
}
</style>
