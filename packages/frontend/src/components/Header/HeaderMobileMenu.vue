<template>
  <div
    ref="menu"
    class="mobile-menu"
    role="dialog"
    aria-modal="true"
    aria-label="Menu"
    data-testid="mobile-menu-dialog"
  >
    <div class="mobile-menu__close">
      <BaseIconButton label="Close menu" size="medium" @click="closeMenu()">
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
          <ThemeToggle />
        </div>
      </template>
    </Navigation>
  </div>
</template>

<script setup lang="ts">
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { useTemplateRef } from 'vue';
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

const closeMenu = () => {
  emit('close');
};

// The menu covers the page, so Tab stays inside it. Focus starts on the close
// button and goes back to the hamburger when the menu unmounts
useFocusTrap(useTemplateRef('menu'), {
  immediate: true,
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
  background: var(--color-surface-secondary);
  overflow-y: scroll;

  /* No user card to sit beside, so the close button gets a row of its own */
  @media (--tablet-portrait-up) {
    padding-top: 3rem;
  }

  &__close {
    position: absolute;
    top: 0.25rem;
    right: 0.5rem;
    z-index: 1;
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
