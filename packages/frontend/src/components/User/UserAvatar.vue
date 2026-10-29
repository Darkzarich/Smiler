<template>
  <img
    v-if="src && !hasFailed"
    class="user-avatar"
    :src="resolveImage(src)"
    :alt="alt"
    referrerpolicy="no-referrer"
    @error="hasFailed = true"
  />
  <IconSmiley
    v-else
    class="user-avatar user-avatar--default"
    role="img"
    :aria-label="alt"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import IconSmiley from '@icons/IconSmiley.vue';
import { resolveImage } from '@/utils/resolve-image';

interface Props {
  /** The stored avatar path or URL; empty when the user has none */
  src: string;
  alt?: string;
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'avatar',
});

/**
 * An avatar that no longer loads (a dead third party link) shows the default
 * smiley rather than a broken image.
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
/* An upload is any shape: crop it to the square the avatar is drawn in */
.user-avatar {
  aspect-ratio: 1;
  object-fit: cover;
}

/* Drawn inline so it takes the theme's logo color */
.user-avatar--default {
  color: var(--color-logo);
}
</style>
