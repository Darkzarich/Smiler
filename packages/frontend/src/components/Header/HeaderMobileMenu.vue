<template>
  <div
    ref="menu"
    class="mobile-menu"
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
      <template #before>
        <NavigationFeedLink class="mobile-menu__nav-link" />
      </template>

      <template v-if="isPhone" #after>
        <div class="mobile-menu__nav-link mobile-menu__theme-item">
          <ThemeToggle labeled />
        </div>
      </template>
    </Navigation>
  </div>
</template>

<script setup lang="ts">
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
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  padding-bottom: env(safe-area-inset-bottom, 0);
  background: var(--color-surface-secondary);
  overflow-y: scroll;

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
}
</style>
