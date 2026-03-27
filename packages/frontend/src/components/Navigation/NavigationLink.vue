<template>
  <RouterLink
    class="nav-link"
    :class="{ 'nav-link--disabled': disabled }"
    :to="to"
  >
    <slot />
  </RouterLink>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

interface Props {
  disabled?: boolean;
  to: RouteLocationRaw & { name: string };
}

withDefaults(defineProps<Props>(), {
  disabled: false,
});
</script>

<style lang="scss">
.nav-link {
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: bold;

  &--disabled {
    color: var(--color-text-secondary);
    user-select: none;
    pointer-events: none;
  }

  &.router-link-exact-active {
    color: var(--color-primary);
  }
}
</style>
