<template>
  <button
    v-if="labeled"
    type="button"
    class="theme-toggle-row"
    data-testid="theme-toggle"
    :aria-label="label"
    @click="toggleTheme"
  >
    <IconSun v-if="currentTheme === 'dark'" />
    <IconMoon v-else />
    {{ nextThemeName }} theme
  </button>

  <BaseIconButton
    v-else
    :label="label"
    data-testid="theme-toggle"
    size="medium"
    @click="toggleTheme"
  >
    <IconSun v-if="currentTheme === 'dark'" />
    <IconMoon v-else />
  </BaseIconButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/store/theme';
import BaseIconButton from '@common/BaseIconButton.vue';
import IconMoon from '@icons/IconMoon.vue';
import IconSun from '@icons/IconSun.vue';

interface Props {
  /** A full-width row with the theme's name, for a menu */
  labeled?: boolean;
}

defineProps<Props>();

const themeStore = useThemeStore();

const currentTheme = computed(() => themeStore.currentTheme);
const nextTheme = computed(() =>
  currentTheme.value === 'dark' ? 'light' : 'dark',
);
const nextThemeName = computed(
  () => nextTheme.value[0].toUpperCase() + nextTheme.value.slice(1),
);
const label = computed(() => `Switch to ${nextTheme.value} theme`);

function toggleTheme() {
  themeStore.toggleTheme();
}
</script>

<style>
.theme-toggle-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
  padding: 0 1rem;
  border: none;
  background: none;
  color: var(--color-text-primary);
  text-align: start;
  font: inherit;
  cursor: pointer;

  svg {
    width: 20px;
    height: 20px;
    color: var(--color-text-secondary);
  }

  /* Inside the row, where the menu's edge can't cover it */
  &:focus-visible {
    outline-offset: -2px;
  }
}
</style>
