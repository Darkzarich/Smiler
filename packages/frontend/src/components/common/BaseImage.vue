<template>
  <img v-if="!hasFailed" :src="src" :alt="alt" @error="hasFailed = true" />
  <span v-else class="base-image-fallback" role="img" :aria-label="alt">
    <IconNoImage />
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import IconNoImage from '@icons/IconNoImage.vue';

interface Props {
  src: string;
  alt: string;
}

const props = defineProps<Props>();

/**
 * A picture that does not load (a dead third party link, a removed upload)
 * shows a placeholder drawn inline, so it takes the theme's colors.
 */
const hasFailed = ref(false);

watch(
  () => props.src,
  () => {
    hasFailed.value = false;
  },
);
</script>

<style>
.base-image-fallback {
  color: var(--color-text-secondary);

  svg {
    display: block;
    width: 96px;
    height: 96px;
    margin: 2rem auto;
  }
}
</style>
