<template>
  <header class="header">
    <div class="header__container">
      <div class="header__mobile-menu">
        <BaseIconButton
          ref="menuButton"
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
        <HeaderMobileMenu
          v-if="isMobileMenuOpen"
          :return-focus-to="menuButton?.$el"
          @close="closeMobileMenu()"
        />
      </Transition>

      <RouterLink class="header__home-link u-touch-area" :to="{ name: 'Home' }">
        <SiteLogo />
      </RouterLink>

      <Navigation
        v-if="!isCompact"
        nav-link-class="header__nav-link"
        class="header__navigation u-flex-row"
      >
        <template #after>
          <NavigationFeedLink class="header__nav-link" />
        </template>
      </Navigation>

      <div class="header__actions">
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

        <ThemeToggle v-if="!isPhone" />

        <!-- From 600px up the sidebar has the sign-in form -->
        <BaseButton
          v-if="isPhone && !user"
          data-testid="header-sign-in"
          class="header__sign-in"
          @click="openSignIn"
        >
          Sign in
        </BaseButton>

        <div v-if="user" class="header__avatar">
          <!-- TODO: Move everything like that to its own component AvatarLink or something -->
          <RouterLink
            class="u-touch-area"
            :to="{
              name: 'UserPage',
              params: {
                login: user.login,
              },
            }"
          >
            <UserAvatar :src="user.avatar" />
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onBeforeUnmount, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import HeaderMobileMenu from './HeaderMobileMenu.vue';
import SiteLogo from './SiteLogo.vue';
import { useMediaQuery } from '@/composables/use-media-query';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseIconButton from '@common/BaseIconButton.vue';
import BaseInput from '@common/BaseInput.vue';
import Navigation from '@components/Navigation/Navigation.vue';
import NavigationFeedLink from '@components/Navigation/NavigationFeedLink.vue';
import ThemeToggle from '@components/Theme/ThemeToggle.vue';
import IconMenuMobile from '@icons/IconMenuMobile.vue';
import IconSearch from '@icons/IconSearch.vue';
import UserAvatar from '@components/User/UserAvatar.vue';

const route = useRoute();
const router = useRouter();

const { user } = storeToRefs(useUserStore());
const authPrompt = useAuthPromptStore();

const isPhone = useMediaQuery('phone-only');
// Below 900px the inline nav does not fit, so it moves into the menu
const isCompact = useMediaQuery('tablet-portrait-down');

const menuButton =
  useTemplateRef<InstanceType<typeof BaseIconButton>>('menuButton');
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

const openSignIn = () => {
  void authPrompt.open({ title: 'Welcome to Smiler', lead: null });
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

// Not a watch on the route: neither a link to the page already shown nor a
// navigation a guard cancels (the sign-in prompt) changes it. afterEach runs
// for both
const removeAfterEach = router.afterEach(closeMobileMenu);

onBeforeUnmount(removeAfterEach);
</script>

<style>
.header {
  display: flex;
  justify-content: center;
  position: fixed;
  top: 0;
  z-index: 2;
  width: 100%;
  height: var(--header-height);
  padding: 0.5rem max(0.5rem, var(--page-gutter));
  background-color: var(--color-surface-elevated);

  &__home-link {
    display: flex;
    align-items: center;

    /* Not grown with a touch phone's taller header: at 320px a bigger logo
       would take the search field's width */
    @media (--phone-only) {
      .site-logo {
        height: 30px;
      }
    }
  }

  &__container {
    display: flex;
    width: 100%;
    max-width: var(--page-max-width);
  }

  &__mobile-menu {
    display: none;
    margin-right: 0.5rem;

    @media (--tablet-portrait-down) {
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
    margin-right: 16px;
    margin-left: 2rem;

    @media (--desktop-up) {
      margin-left: 4rem;
    }
  }

  &__nav-link {
    padding-top: 5px;
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: all 200ms ease-out;

    @media (--hover) {
      &:hover {
        color: var(--color-primary-strong);
      }
    }

    &.router-link-exact-active {
      border-bottom: 2px solid var(--color-primary-strong);
    }
  }

  /* One group, so it stays on the right whether or not the search is shown */
  &__actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-width: 0;
    gap: 12px;
    margin-left: auto;

    @media (--phone-only) {
      flex: 1;
    }
  }

  &__search {
    display: flex;
    align-items: center;
    width: 14rem;
    min-width: 8rem;

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

  &__sign-in {
    flex-shrink: 0;
    white-space: nowrap;
  }

  &__avatar {
    display: flex;
    height: 100%;
    align-self: center;

    .user-avatar {
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
