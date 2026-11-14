<template>
  <div ref="menu" class="mobile-menu">
    <!-- Out of the Tab order: the close button in the panel is the one to reach -->
    <button
      type="button"
      class="mobile-menu__backdrop"
      aria-label="Close menu"
      tabindex="-1"
      data-testid="mobile-menu-backdrop"
      @click="closeMenu()"
    />

    <div
      class="mobile-menu__panel"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      data-testid="mobile-menu-dialog"
    >
      <div class="mobile-menu__header">
        <RouterLink
          class="mobile-menu__home-link u-touch-area"
          :to="{ name: 'Home' }"
        >
          <SiteLogo />
        </RouterLink>

        <BaseIconButton
          ref="closeButton"
          label="Close menu"
          size="medium"
          @click="closeMenu()"
        >
          <IconClose />
        </BaseIconButton>
      </div>

      <!-- Wider than a phone, the sidebar and the header already show these -->
      <CurrentUser v-if="isPhone" class="mobile-menu__user" />

      <Navigation
        nav-link-class="mobile-menu__nav-link"
        class="mobile-menu__navigation u-flex-col"
      >
        <template #after>
          <NavigationFeedLink class="mobile-menu__nav-link" />

          <div
            v-if="isPhone"
            class="mobile-menu__nav-link mobile-menu__theme-item"
          >
            <ThemeToggle labeled />
          </div>
        </template>
      </Navigation>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useScrollLock } from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { useTemplateRef } from 'vue';
import SiteLogo from './SiteLogo.vue';
import { useMediaQuery } from '@/composables/use-media-query';
import BaseIconButton from '@common/BaseIconButton.vue';
import Navigation from '@components/Navigation/Navigation.vue';
import NavigationFeedLink from '@components/Navigation/NavigationFeedLink.vue';
import ThemeToggle from '@components/Theme/ThemeToggle.vue';
import CurrentUser from '@components/User/CurrentUser.vue';
import IconClose from '@icons/IconClose.vue';

interface Props {
  /** Where focus goes when the menu closes. Safari focuses no button on a click */
  returnFocusTo?: HTMLElement;
}

interface Emits {
  close: [];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isPhone = useMediaQuery('phone-only');

const closeButton = useTemplateRef('closeButton');

const closeMenu = () => {
  emit('close');
};

// On <html>, where the page scrolls (see BaseModal)
useScrollLock(document.documentElement, true);

// The menu covers the page, so Tab stays inside it. Focus starts on the close
// button and goes back to the hamburger when the menu unmounts
useFocusTrap(useTemplateRef('menu'), {
  immediate: true,
  initialFocus: () => closeButton.value?.$el,
  setReturnFocus: (previous) => props.returnFocusTo ?? previous,
  // Leave the trap to the unmount, so the parent decides when the menu closes
  escapeDeactivates: () => {
    closeMenu();

    return false;
  },
});
</script>

<style>
.mobile-menu {
  position: fixed;
  z-index: 1000;
  inset: 0;

  /* A phone's sheet covers it */
  &__backdrop {
    position: absolute;
    padding: 0;
    border: none;
    background: rgb(0 0 0 / 50%);
    inset: 0;
    cursor: pointer;

    @media (--phone-only) {
      display: none;
    }
  }

  /* Wider than a phone it holds only the links, which a whole screen would
     dwarf, so it is a drawer over the page there */
  &__panel {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: calc(320px + env(safe-area-inset-left, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0);
    box-shadow: 0 0 24px rgb(0 0 0 / 25%);
    background: var(--color-surface-secondary);
    overflow-y: auto;
    overscroll-behavior: contain;

    @media (--phone-only) {
      width: 100%;
      box-shadow: none;
    }
  }

  /* The page header's height and gutter, so the logo stays where it was */
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1;
    height: var(--header-height);
    padding: calc(0.5rem + env(safe-area-inset-top, 0px))
      max(0.5rem, var(--page-gutter-right)) 0.5rem
      max(0.5rem, var(--page-gutter-left));
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface-secondary);

    @media (--tablet-portrait-up) {
      padding-right: 0.5rem;
    }
  }

  &__home-link {
    display: flex;
    align-items: center;
    height: 100%;

    @media (--phone-only) {
      .site-logo {
        height: 30px;
      }
    }
  }

  &__navigation {
    overflow-x: hidden;
  }

  &__nav-link {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 48px;
    padding: 0 max(1rem, var(--page-gutter-right)) 0
      max(1rem, var(--page-gutter-left));
    border-bottom: 1px solid var(--color-border);

    @media (--tablet-portrait-up) {
      padding-right: 1rem;
    }
  }

  /* Over .nav-link's bold, whichever of the two stylesheets loads last */
  &__navigation &__nav-link {
    font-weight: 500;
  }

  /* The button inside is the row, so all of it takes the tap */
  &__theme-item {
    align-items: stretch;
    padding: 0;
  }

  /* Flat inside the menu, where a card's corners and ring would sit against
     the header row. Doubled up to win over .u-widget, which loads later */
  &__user.u-widget {
    border-bottom: 1px solid var(--color-border);
    border-radius: 0;
    box-shadow: none;
  }

  &-enter-active,
  &-leave-active {
    transition: opacity 0.2s;

    .mobile-menu__panel {
      transition: transform 0.2s;
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .mobile-menu__panel {
      transform: translateX(-100%);

      @media (--phone-only) {
        transform: translateY(-15px);
      }
    }
  }
}
</style>
