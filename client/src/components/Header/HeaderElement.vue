<template>
  <header class="header">
    <div class="header__container">
      <div
        data-testid="mobile-menu"
        class="header__mobile-menu"
        :class="isMobileMenuOpen ? 'header__mobile--active' : ''"
        @click="toggleMobileMenu()"
      >
        <MobileMenuIcon />
      </div>

      <!-- TODO: Should be moved to App.vue -->
      <Transition name="header__mobile-menu">
        <HeaderMobileMenu
          v-if="isMobileMenuOpen"
          @close="isMobileMenuOpen = false"
        />
      </Transition>

      <RouterLink class="header__home-link" :to="{ name: 'Home' }">
        <SiteLogo />
      </RouterLink>

      <nav class="header__navigation">
        <template v-if="!$isMobile()">
          <RouterLink
            class="header__nav-link"
            :to="{ name: 'Home' }"
            data-testid="today-link"
          >
            TODAY
          </RouterLink>
          <RouterLink
            class="header__nav-link"
            :to="{ name: 'All' }"
            data-testid="all-link"
          >
            ALL
          </RouterLink>
          <RouterLink
            class="header__nav-link"
            :to="{ name: 'Blowing' }"
            data-testid="blowing-link"
          >
            BLOWING
          </RouterLink>
          <RouterLink
            class="header__nav-link"
            :to="{ name: 'TopThisWeek' }"
            data-testid="top-this-week-link"
          >
            TOP THIS WEEK
          </RouterLink>
          <RouterLink
            class="header__nav-link"
            :to="{ name: 'New' }"
            data-testid="new-link"
          >
            NEW
          </RouterLink>

          <template v-if="isUserAuth">
            <RouterLink
              class="header__nav-link"
              :to="{ name: 'Feed' }"
              data-testid="feed-link"
            >
              MY FEED
            </RouterLink>
          </template>
          <template v-else>
            <span
              data-testid="feed-link"
              title="Log in to access this page"
              class="header__nav-link header__nav-link--disabled"
              >MY FEED</span
            >
          </template>
        </template>
      </nav>

      <!-- TODO: Move to Search component -->
      <div v-if="$route.name !== 'Search'" class="header__search">
        <InputElement
          v-model.trim="title"
          :placeholder="'Search'"
          data-testid="header-search-input"
          icon="SearchIcon"
          :style="'flex-direction: row'"
          :enter-callback="search"
          :icon-click-callback="search"
        />
      </div>

      <div v-if="isUserAuth" class="header-container__avatar">
        <!-- TODO: Move everything like that to its own component AvatarLink or something -->
        <RouterLink
          :to="{
            name: 'UserPage',
            params: {
              login: user.login,
            },
          }"
        >
          <img :src="$resolveAvatar(user.avatar)" alt="avatar" />
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import HeaderMobileMenu from './HeaderMobileMenu.vue';
import SiteLogo from './SiteLogo.vue';
import InputElement from '@/components/BasicElements/InputElement.vue';
import MobileMenuIcon from '@/library/svg/MobileMenuIcon.vue';

export default {
  components: {
    HeaderMobileMenu,
    InputElement,
    MobileMenuIcon,
    SiteLogo,
  },
  data() {
    return {
      isMobileMenuOpen: false,
      // for search
      title: '',
    };
  },
  computed: {
    ...mapGetters(['isUserAuth']),
    ...mapState({
      user: (state) => state.user,
    }),
  },
  methods: {
    search() {
      if (this.title.length > 0) {
        this.$router.push({
          name: 'Search',
          query: {
            title: this.title,
          },
        });
      }
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';
@import '@/styles/colors';

.header {
  background-color: $header;
  width: 100%;
  position: fixed;
  top: 0;
  z-index: 2;
  padding: 0.5rem;
  height: 56px;
  display: flex;
  justify-content: center;

  @include for-size(phone-only) {
    height: 46px;
  }

  &__home-link {
    display: flex;
  }

  &__container {
    display: flex;
    padding-left: 40px;
    width: 100%;
    max-width: 1110px;

    @include for-size(phone-only) {
      padding-left: 0;
      padding-right: 0;
    }
  }

  &__mobile-menu {
    display: none;
    margin-right: 1rem;
    cursor: pointer;

    @include for-size(phone-only) {
      display: block;

      svg {
        height: 100%;
        fill: $light-gray;
      }
    }

    &-enter-active,
    &-leave-active {
      transition: all 0.2s;
    }

    &-enter,
    &-leave-to {
      opacity: 0;
      transform: translateY(15px);

      @include for-size(phone-only) {
        transform: translateY(-15px);
      }
    }

    &--active {
      svg {
        fill: $main-text;
      }
    }
  }

  &__navigation {
    @include flex-row;

    align-items: center;
    margin-left: 4rem;

    @include for-size(phone-only) {
      margin-left: 0;
    }
  }

  &__nav-link {
    color: $main-text;
    padding-top: 5px;
    border-bottom: 2px solid transparent;
    text-decoration: none;
    font-weight: bold;
    margin-left: 1rem;

    &:hover {
      border-bottom: 2px solid $main-text;
    }

    &--disabled {
      color: $light-gray;
      border-bottom: 2px solid transparent;
      cursor: default;
      user-select: none;
    }

    &.router-link-exact-active {
      color: $firm;
      border-bottom: 2px solid $firm;
    }
  }

  &__search {
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  &__avatar {
    display: flex;
    margin-left: auto;
    margin-right: 3rem;
    align-self: center;

    @include for-size(phone-only) {
      margin-right: 1rem;
    }

    img {
      border-radius: 50%;
      border: 1px solid $light-gray;
      width: 2.5rem;
      height: 2.5rem;
      cursor: pointer;

      @include for-size(phone-only) {
        width: 2rem;
        height: 2rem;
      }
    }
  }
}
</style>
