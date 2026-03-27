<template>
  <div class="mobile-menu">
    <div class="mobile-menu__close-btn" @click="closeMenu()">
      <IconExit />
    </div>

    <CurrentUser class="mobile-menu__user" />

    <Navigation
      nav-link-class="mobile-menu__nav-link"
      class="mobile-menu__navigation u-flex-col"
    >
      <template #before>
        <NavigationFeedLink
          :is-auth="Boolean(userStore.user)"
          class="mobile-menu__nav-link"
        />
      </template>

      <template #after>
        <div class="mobile-menu__nav-link mobile-menu__theme-item">
          <ThemeToggle />
        </div>
      </template>
    </Navigation>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user';
import Navigation from '@components/Navigation/Navigation.vue';
import NavigationFeedLink from '@components/Navigation/NavigationFeedLink.vue';
import ThemeToggle from '@components/Theme/ThemeToggle.vue';
import CurrentUser from '@components/User/CurrentUser.vue';
import IconExit from '@icons/IconExit.vue';

interface Emits {
  close: [];
}

const emit = defineEmits<Emits>();

const userStore = useUserStore();

const closeMenu = () => {
  emit('close');
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.mobile-menu {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  background: var(--color-surface-secondary);
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
    overflow-x: hidden;
  }

  &__nav-link {
    width: 100%;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);

    &:first-child {
      border-top: 1px solid var(--color-border);
    }
  }

  &__theme-item {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__user {
    border: none;
  }
}
</style>
