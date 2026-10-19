<template>
  <header class="header">
    <div class="header__container">
      <div class="header__mobile-menu">
        <BaseIconButton
          label="Menu"
          data-testid="mobile-menu"
          size="medium"
          :aria-expanded="isMobileMenuOpen"
          @click="toggleMobileMenu()"
        >
          <IconMenuMobile />
        </BaseIconButton>
      </div>

      <!-- TODO: Should be moved to App.vue -->
      <Transition name="header__mobile-menu">
        <HeaderMobileMenu v-if="isMobileMenuOpen" @close="toggleMobileMenu()" />
      </Transition>

      <RouterLink class="header__home-link" :to="{ name: 'Home' }">
        <SiteLogo />
      </RouterLink>

      <Navigation
        v-if="!isPhone"
        nav-link-class="header__nav-link"
        class="header__navigation u-flex-row"
      >
        <template #after>
          <NavigationFeedLink class="header__nav-link" />
        </template>
      </Navigation>

      <!-- TODO: Move to Search component -->
      <div v-if="route.name !== 'Search'" class="header__search">
        <BaseInput
          v-model.trim="searchInputValue"
          placeholder="Search"
          data-testid="header-search-input"
          :style="'flex-direction: row'"
          @keyup.enter="search"
        >
          <template #icon-right>
            <BaseIconButton
              label="Search"
              data-testid="header-search-button"
              @click="search"
            >
              <IconSearch />
            </BaseIconButton>
          </template>
        </BaseInput>
      </div>

      <ThemeToggle v-if="!isPhone" class="header__theme-toggle" />

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
          <img
            :src="resolveAvatar(user.avatar)"
            alt="avatar"
            referrerpolicy="no-referrer"
          />
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import HeaderMobileMenu from './HeaderMobileMenu.vue';
import SiteLogo from './SiteLogo.vue';
import { useMediaQuery } from '@/composables/use-media-query';
import { useUserStore } from '@/store/user';
import { resolveAvatar } from '@/utils/resolve-avatar';
import BaseIconButton from '@common/BaseIconButton.vue';
import BaseInput from '@common/BaseInput.vue';
import Navigation from '@components/Navigation/Navigation.vue';
import NavigationFeedLink from '@components/Navigation/NavigationFeedLink.vue';
import ThemeToggle from '@components/Theme/ThemeToggle.vue';
import IconMenuMobile from '@icons/IconMenuMobile.vue';
import IconSearch from '@icons/IconSearch.vue';

const route = useRoute();
const router = useRouter();

const { user } = storeToRefs(useUserStore());

const isPhone = useMediaQuery('phone-only');

const isMobileMenuOpen = ref(false);
const searchInputValue = ref('');

const search = () => {
  router.push({
    name: 'Search',
    query: {
      title: searchInputValue.value,
    },
  });

  searchInputValue.value = '';
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

watch(
  () => route.name,
  () => {
    if (isMobileMenuOpen.value) {
      toggleMobileMenu();
    }
  },
);
</script>

<style>
.header {
  display: flex;
  justify-content: center;
  position: fixed;
  top: 0;
  z-index: 2;
  width: 100%;
  height: 56px;
  padding: 0.5rem;
  background-color: var(--color-surface-elevated);

  @media (--phone-only) {
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

    @media (--phone-only) {
      padding-right: 0;
      padding-left: 0;
    }
  }

  &__mobile-menu {
    display: none;
    margin-right: 0.5rem;

    @media (--phone-only) {
      display: flex;
      align-items: center;
    }

    &-enter-active,
    &-leave-active {
      transition: all 0.2s;
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: translateY(15px);

      @media (--phone-only) {
        transform: translateY(-15px);
      }
    }
  }

  &__navigation {
    align-items: center;
    gap: 16px;
    margin-left: 4rem;
  }

  &__nav-link {
    padding-top: 5px;
    border-bottom: 2px solid transparent;
    transition: all 200ms ease-out;

    &:hover {
      color: var(--color-primary);
    }

    &.router-link-exact-active {
      border-bottom: 2px solid var(--color-primary);
    }
  }

  &__search {
    display: flex;
    align-items: center;
    width: 14rem;
    margin-left: auto;

    @media (--phone-only) {
      flex: 1;
      width: auto;
      min-width: 0;
    }

    .base-input {
      flex: 1;
      min-width: 0;
    }

    .base-input__input {
      width: 100%;
      min-width: 0;
    }
  }

  &__theme-toggle {
    margin-left: 16px;
  }

  &__avatar {
    display: flex;
    height: 100%;
    margin-left: auto;
    align-self: center;

    .header__search + & {
      margin-left: 12px;
    }

    img {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      cursor: pointer;

      @media (--phone-only) {
        width: 2rem;
        height: 2rem;
      }
    }
  }
}
</style>
