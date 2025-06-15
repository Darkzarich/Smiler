<template>
  <div class="post-editor-video">
    <div v-if="!value" class="post-editor-video__container">
      <div class="post-editor-video__input-url">
        <BaseInput
          v-model.lazy="videoUrl"
          placeholder="Paste URL of the video [youtube]"
          data-testid="video-url-input"
        />

        <BaseButton
          class="post-editor-video__upload-btn"
          stretched
          data-testid="video-upload-button"
          :loading="isUploading"
          :disabled="!videoUrl"
          @click="upload"
        >
          Upload
        </BaseButton>
      </div>
    </div>

    <div
      v-else
      class="post-editor-video__video"
      :test-dataid="`video-${value}`"
    >
      <iframe
        title="video"
        :src="value"
        frameborder="0"
        width="560"
        height="315"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useNotificationsStore } from '@/store/notifications';
import { generateVideoEmbedLink } from '@/utils/generate-video-embed-link';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';

const notificationsStore = useNotificationsStore();

const videoUrl = ref('');

const isUploading = ref(false);

const value = defineModel<string>({
  default: '',
});

const upload = () => {
  isUploading.value = true;

  if (typeof value.value !== 'string') {
    handleError();
  }

  value.value = generateVideoEmbedLink(value.value);

  isUploading.value = false;
};

// TODO: Figure out why it's not triggered sometimes
const handleError = () => {
  isUploading.value = false;

  notificationsStore.showErrorNotification({
    message:
      'The video link you provided could not be loaded. Please try a different one.',
  });

  videoUrl.value = '';
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.post-editor-video {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;

  @include mixins.for-size(phone-only) {
    border-right: none;
    border-left: none;
    border-radius: 0;
  }

  &__upload-btn {
    margin-top: 20px;
  }

  &__video {
    display: flex;
    flex-flow: row nowrap;
    border: 1px solid var(--color-gray-light);

    video,
    iframe {
      width: 100%;
    }
  }
}
</style>
