<template>
  <div class="mobile-menu">
    <div @click="closeMenu()" class="mobile-menu__close-icon">
      <exit-icon />
    </div>
    <div class="mobile-menu__user">
      <!-- vue requires .native to catch click event for vue-router links -->
      <user
        :nav-native="true"
        @close="closeMenu()"
      />
    </div>
    <div class="mobile-menu__nav-container">

      <template v-if="user.authState">
        <router-link class="mobile-menu__nav-link" @click.native="closeMenu()" :to="{ name: 'Feed' }">
          <div>MY FEED</div>
        </router-link>
      </template>
      <template v-else>
        <a
          title="Log in to access this page"
          class="mobile-menu__nav-link mobile-menu__nav-link_disabled">
          <div>MY FEED</div>
        </a>
      </template>

      <router-link class="mobile-menu__nav-link" @click.native="closeMenu()" :to="{ name: 'Home' }" data-testid="today-link">
        <div>TODAY</div>
      </router-link>
      <router-link class="mobile-menu__nav-link" @click.native="closeMenu()" :to="{ name: 'All' }" data-testid="all-link">
        <div>ALL</div>
      </router-link>
      <router-link class="mobile-menu__nav-link" @click.native="closeMenu()" :to="{ name: 'Blowing' }" data-testid="blowing-link">
        <div title="posted recently, 50+ rating">BLOWING</div>
      </router-link>
      <router-link class="mobile-menu__nav-link" @click.native="closeMenu()" :to="{ name: 'TopThisWeek' }" data-testid="top-this-week-link">
        <div title="current week posts sorted by newer">TOP THIS WEEK</div>
      </router-link>
      <router-link class="mobile-menu__nav-link" @click.native="closeMenu()" :to="{ name: 'New' }" data-testid="new-link">
        <div title="posts posted 2 hours ago sorted by newer">NEW</div>
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import user from '@/components/User/User.vue';
import exitIcon from '@/library/svg/exit.vue';

export default {
  components: {
    user,
    exitIcon,
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
@import "@/styles/mixins.scss";
@import "@/styles/colors.scss";

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
    @include flex-col();
  }
  &__nav-link {
    width: 100%;
    padding: 1rem;
    font-weight: bold;
    text-decoration: none;
    border-bottom: 1px solid $light-gray;
    div {
      color: $main-text;
    }
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
}
</style>
