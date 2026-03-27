<template>
  <BaseButton
    type="icon"
    :aria-label="`Switch to ${nextTheme} theme`"
    data-testid="theme-toggle"
    @click="toggleTheme"
  >
    <IconSun v-if="currentTheme === 'dark'" />
    <IconMoon v-else />
  </BaseButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '@/store/theme';
import BaseButton from '@common/BaseButton.vue';
import IconMoon from '@icons/IconMoon.vue';
import IconSun from '@icons/IconSun.vue';

const themeStore = useThemeStore();

const currentTheme = computed(() => themeStore.currentTheme);
const nextTheme = computed(() =>
  currentTheme.value === 'dark' ? 'light' : 'dark',
);

function toggleTheme() {
  themeStore.toggleTheme();
}
</script>
