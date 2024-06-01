<template>
  <div class="mobile-menu">
    <div class="mobile-menu__close-btn" @click="closeMenu()">
      <ExitIcon />
    </div>

    <div class="mobile-menu__user">
      <!-- vue requires .native to catch click event for vue-router links -->
      <CurrentUser :nav-native="true" @close="closeMenu()" />
    </div>

    <div class="mobile-menu__navigation">
      <template v-if="user.authState">
        <RouterLink
          data-testid="feed-link"
          class="mobile-menu__nav-link"
          :to="{ name: 'Feed' }"
          @click.native="closeMenu()"
        >
          MY FEED
        </RouterLink>
      </template>
      <template v-else>
        <span
          data-testid="feed-link"
          title="Log in to access this page"
          class="mobile-menu__nav-link mobile-menu__nav-link--disabled"
        >
          MY FEED
        </span>
      </template>

      <!-- TODO: This is repeated in HeaderElement, move to a common constant for both
      the idea is use go over constant and form menu
      -->
      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'Home' }"
        data-testid="today-link"
        @click.native="closeMenu()"
      >
        TODAY
      </RouterLink>

      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'All' }"
        data-testid="all-link"
        @click.native="closeMenu()"
      >
        ALL
      </RouterLink>

      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'Blowing' }"
        data-testid="blowing-link"
        @click.native="closeMenu()"
      >
        BLOWING
      </RouterLink>

      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'TopThisWeek' }"
        data-testid="top-this-week-link"
        @click.native="closeMenu()"
      >
        TOP THIS WEEK
      </RouterLink>

      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'New' }"
        data-testid="new-link"
        @click.native="closeMenu()"
      >
        NEW
      </RouterLink>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import CurrentUser from '@/components/User/CurrentUser.vue';
import ExitIcon from '@/library/svg/ExitIcon.vue';

export default {
  components: {
    CurrentUser,
    ExitIcon,
  },
  computed: {
    ...mapState({
      user: (state) => state.user,
    }),
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
    font-weight: bold;
    text-decoration: none;
    border-bottom: 1px solid $light-gray;
    color: $main-text;

    &--disabled {
      border-top: 1px solid $light-gray;
      color: $light-gray;
      cursor: default;
      user-select: none;
    }

    &.router-link-exact-active {
      color: $firm;
    }
  }

  &__user {
    margin-bottom: 0.5rem;

    .current-user {
      border: none;
    }
  }
}
</style>
