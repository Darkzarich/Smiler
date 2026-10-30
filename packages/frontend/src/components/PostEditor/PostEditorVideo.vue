<template>
  <div class="post-editor-video">
    <div v-if="!value" class="post-editor-video__input-url">
      <BaseInput
        v-model="videoUrl"
        placeholder="Paste a video link"
        :error="error"
        show-error
        data-testid="video-url-input"
        @keyup.enter="addVideo"
      />

      <p class="post-editor-video__hint">
        {{ VIDEO_PROVIDER_NAMES.join(', ') }}, or a link to an .mp4, .webm, .mov
        or .ogv file
      </p>

      <BaseButton
        class="post-editor-video__add-btn"
        stretched
        data-testid="video-upload-button"
        :disabled="!videoUrl.trim()"
        @click="addVideo"
      >
        Add video
      </BaseButton>
    </div>

    <div v-else class="post-editor-video__video">
      <PostVideo :url="value" data-testid="video-preview" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import PostVideo from '../Post/PostVideo.vue';
import {
  UNPLAYABLE_VIDEO_EXTENSIONS,
  VIDEO_PROVIDER_NAMES,
  getUrlExtension,
  parseVideoUrl,
} from '@/utils/parse-video-url';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';

const value = defineModel<string>({
  default: '',
});

const videoUrl = ref('');

const error = ref('');

watch(videoUrl, () => {
  error.value = '';
});

function describeUnplayable(url: string) {
  try {
    const extension = getUrlExtension(new URL(url.trim()));

    if (UNPLAYABLE_VIDEO_EXTENSIONS.includes(extension)) {
      return `Browsers can’t play .${extension} files. Link to an .mp4 or .webm version instead.`;
    }
  } catch {
    // Not a url at all, which the generic message covers
  }

  return 'This link isn’t a video we can play. Check it against the list below.';
}

function addVideo() {
  const url = videoUrl.value.trim();

  if (!url) {
    return;
  }

  if (!parseVideoUrl(url)) {
    error.value = describeUnplayable(url);

    return;
  }

  value.value = url;
}
</script>

<style>
.post-editor-video {
  width: 100%;
  padding: 1rem;

  &__hint {
    margin: 6px 0 0;
    color: var(--color-text-secondary);
    font-size: 13px;
  }

  &__add-btn {
    margin-top: 20px;
  }

  &__video {
    display: flex;
    justify-content: center;
    border: 1px solid var(--color-text-secondary);
  }
}
</style>
