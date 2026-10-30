<template>
  <!-- YouTube refuses to play (error 153) in a frame whose request carries no
       referrer -->
  <iframe
    v-if="source?.kind === 'embed'"
    class="post-video post-video--embed"
    :class="{ 'post-video--portrait': source.isPortrait }"
    :src="source.src"
    :title="`${source.provider} video`"
    loading="lazy"
    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
    allowfullscreen
    referrerpolicy="strict-origin-when-cross-origin"
  />

  <video
    v-else-if="source?.kind === 'file' && !hasFailed"
    class="post-video"
    controls
    playsinline
    preload="metadata"
    :src="source.src"
    @error="hasFailed = true"
  >
    <track kind="captions" />
  </video>

  <div v-else class="post-video post-video--unavailable" role="note">
    <IconVideo class="post-video__icon" />
    <span>This video can’t be played here.</span>
    <a
      v-if="link"
      class="post-video__link"
      :href="link"
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      Open the link
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { parseVideoUrl } from '@/utils/parse-video-url';
import IconVideo from '@icons/IconVideo.vue';

interface Props {
  url: string;
}

const props = defineProps<Props>();

const source = computed(() => parseVideoUrl(props.url));

const hasFailed = ref(false);

watch(
  () => props.url,
  () => {
    hasFailed.value = false;
  },
);

const link = computed(() => {
  try {
    const url = new URL(props.url);

    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
});
</script>

<style>
.post-video {
  display: block;
  width: 100%;
  border: 0;

  /* Capped by height like a picture, so a landscape phone still shows the
     whole player, and narrowed to keep its shape rather than letterboxed */
  &--embed {
    width: min(100%, 80svh * 16 / 9);
    height: auto;
    aspect-ratio: 16 / 9;
  }

  &--portrait {
    width: min(100%, 80svh * 9 / 16);
    aspect-ratio: 9 / 16;
  }

  /* Until its metadata arrives a video is a 2:1 box, so the feed below it
     jumps when the real size lands; most videos are 16:9 */
  &:is(video) {
    height: auto;
    max-height: 80svh;
    aspect-ratio: auto 16 / 9;
    object-fit: contain;
  }

  &--unavailable {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 2rem 1rem;
    color: var(--color-text-secondary);
    text-align: center;
  }

  &__icon {
    width: 20px;
    height: 20px;
    fill: currentcolor;
  }

  &__link {
    color: var(--color-primary-strong);
  }
}
</style>
