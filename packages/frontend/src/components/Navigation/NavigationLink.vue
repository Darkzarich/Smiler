<template>
  <RouterLink class="nav-link" :to="to">
    <slot />
  </RouterLink>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

interface Props {
  to: RouteLocationRaw & { name: string };
}

defineProps<Props>();
</script>

<style>
.nav-link {
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: bold;

  &.router-link-exact-active {
    color: var(--color-primary);
  }
}
</style>
