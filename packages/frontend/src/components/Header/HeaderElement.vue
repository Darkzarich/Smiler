<template>
  <header class="header">
    <div class="header__container">
      <div
        data-testid="mobile-menu"
        class="header__mobile-menu"
        :class="isMobileMenuOpen ? 'header__mobile--active' : ''"
        @click="toggleMobileMenu()"
      >
        <IconMenuMobile />
      </div>

      <!-- TODO: Should be moved to App.vue -->
      <Transition name="header__mobile-menu">
        <HeaderMobileMenu v-if="isMobileMenuOpen" @close="toggleMobileMenu()" />
      </Transition>

      <RouterLink class="header__home-link" :to="{ name: 'Home' }">
        <SiteLogo />
      </RouterLink>

      <Navigation
        v-if="isDesktop()"
        nav-link-class="header__nav-link"
        class="header__navigation"
      >
        <template #after>
          <NavigationFeedLink
            class="header__nav-link"
            :is-auth="Boolean(user)"
          />
        </template>
      </Navigation>

      <!-- TODO: Move to Search component -->
      <div v-if="$route.name !== 'Search'" class="header__search">
        <BaseInput
          v-model.trim="searchInputValue"
          placeholder="Search"
          data-testid="header-search-input"
          icon="IconSearch"
          :style="'flex-direction: row'"
          @keyup.enter="search"
          @click-icon="search"
        />
      </div>

      <div v-if="user" class="header__avatar">
        <!-- TODO: Move everything like that to its own component AvatarLink or something -->
        <RouterLink
          :to="{
            name: 'UserPage',
            params: {
              login: user.login,
            },
          }"
        >
          <img :src="resolveAvatar(user.avatar)" alt="avatar" />
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState } from 'pinia';
import { defineComponent } from 'vue';
import HeaderMobileMenu from './HeaderMobileMenu.vue';
import SiteLogo from './SiteLogo.vue';
import { useUserStore } from '@/store/user';
import { resolveAvatar } from '@/utils/resolve-avatar';
import BaseInput from '@common/BaseInput.vue';
import Navigation from '@components/Navigation/Navigation.vue';
import NavigationFeedLink from '@components/Navigation/NavigationFeedLink.vue';
import IconMenuMobile from '@icons/IconMenuMobile.vue';
import { isDesktop } from '@utils/is-desktop';

export default defineComponent({
  components: {
    HeaderMobileMenu,
    BaseInput,
    IconMenuMobile,
    SiteLogo,
    Navigation,
    NavigationFeedLink,
  },
  data() {
    return {
      isMobileMenuOpen: false,
      searchInputValue: '',
    };
  },
  computed: {
    ...mapState(useUserStore, ['user']),
  },
  watch: {
    $route() {
      if (this.isMobileMenuOpen) {
        this.toggleMobileMenu();
      }
    },
  },
  methods: {
    resolveAvatar,
    search() {
      this.$router.push({
        name: 'Search',
        query: {
          title: this.searchInputValue,
        },
      });

      this.searchInputValue = '';
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
    isDesktop,
  },
});
</script>

<style lang="scss">
@import '@/styles/mixins';

.header {
  display: flex;
  justify-content: center;
  position: fixed;
  top: 0;
  z-index: 2;
  width: 100%;
  height: 56px;
  padding: 0.5rem;
  background-color: var(--color-header);

  @include for-size(phone-only) {
    height: 46px;
  }

  &__home-link {
    display: flex;
  }

  &__container {
    display: flex;
    width: 100%;
    max-width: 1110px;
    padding-left: 40px;

    @include for-size(phone-only) {
      padding-right: 0;
      padding-left: 0;
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
        fill: var(--color-gray-light);
      }
    }

    &-enter-active,
    &-leave-active {
      transition: all 0.2s;
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: translateY(15px);

      @include for-size(phone-only) {
        transform: translateY(-15px);
      }
    }

    &--active {
      svg {
        fill: var(--color-main-text);
      }
    }
  }

  &__navigation {
    @include flex-row;

    align-items: center;
    gap: 16px;
    margin-left: 4rem;

    @include for-size(phone-only) {
      margin-left: 0;
    }
  }

  &__nav-link {
    padding-top: 5px;
    border-bottom: 2px solid transparent;
    transition: all 200ms ease-out;

    &:hover {
      color: var(--color-primary);
    }

    .nav-link--disabled {
      border-bottom: 2px solid transparent;
    }

    &.router-link-exact-active {
      border-bottom: 2px solid var(--color-primary);
    }
  }

  &__search {
    display: flex;
    align-items: center;
    margin-left: auto;

    @include for-size(phone-only) {
      width: 70%;
    }
  }

  &__avatar {
    display: flex;
    height: 100%;
    margin-left: auto;
    align-self: center;

    img {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      cursor: pointer;

      @include for-size(phone-only) {
        width: 2rem;
        height: 2rem;
      }
    }
  }
}
</style>
