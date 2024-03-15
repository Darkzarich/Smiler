<template>
  <div class="mobile-menu">
    <div
      class="mobile-menu__close-icon"
      @click="closeMenu()"
    >
      <ExitIcon />
    </div>
    <div class="mobile-menu__user">
      <!-- vue requires .native to catch click event for vue-router links -->
      <User
        :nav-native="true"
        @close="closeMenu()"
      />
    </div>
    <div class="mobile-menu__nav-container">
      <template v-if="user.authState">
        <RouterLink
          class="mobile-menu__nav-link"
          :to="{ name: 'Feed' }"
          @click.native="closeMenu()"
        >
          <div>MY FEED</div>
        </RouterLink>
      </template>
      <template v-else>
        <a
          title="Log in to access this page"
          class="mobile-menu__nav-link mobile-menu__nav-link_disabled"
        >
          <div>MY FEED</div>
        </a>
      </template>

      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'Home' }"
        data-testid="today-link"
        @click.native="closeMenu()"
      >
        <div>TODAY</div>
      </RouterLink>
      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'All' }"
        data-testid="all-link"
        @click.native="closeMenu()"
      >
        <div>ALL</div>
      </RouterLink>
      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'Blowing' }"
        data-testid="blowing-link"
        @click.native="closeMenu()"
      >
        <div title="posted recently, 50+ rating">BLOWING</div>
      </RouterLink>
      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'TopThisWeek' }"
        data-testid="top-this-week-link"
        @click.native="closeMenu()"
      >
        <div title="current week posts sorted by newer">TOP THIS WEEK</div>
      </RouterLink>
      <RouterLink
        class="mobile-menu__nav-link"
        :to="{ name: 'New' }"
        data-testid="new-link"
        @click.native="closeMenu()"
      >
        <div title="posts posted 2 hours ago sorted by newer">NEW</div>
      </RouterLink>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import User from '@/components/User/User.vue';
import ExitIcon from '@/library/svg/ExitIcon.vue';

export default {
  components: {
    User,
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

  // border: 1px solid $light-gray;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  overflow-y: scroll;
  z-index: 1000;

  &__nav-link {
    width: 100%;
    padding: 1rem;
    font-weight: bold;
    text-decoration: none;
    border-bottom: 1px solid $light-gray;

    &_disabled {
      border-top: 1px solid $light-gray;

      div {
        color: $light-gray !important;
        border-bottom: 2px solid transparent !important;
        cursor: default;
        user-select: none;
      }
    }
  }

  div {
    color: $main-text;
  }

  .router-link-exact-active {
    div {
      color: $firm !important;
    }
  }

  &__close-icon {
    position: absolute;
    right: 0.5rem;
    top: 0.5rem;

    svg {
      fill: $error;
    }
  }

  &__user {
    margin-bottom: 0.5rem;

    .user {
      border: none;
    }
  }

  &__nav-container {
    overflow-x: hidden;

    @include flex-col;
  }
}
</style>
