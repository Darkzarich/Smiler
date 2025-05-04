<template>
  <div class="post-editor-video">
    <div v-if="!value" class="post-editor-video__container">
      <div class="post-editor-video__input-url">
        <BaseInput
          v-model.lazy="url"
          placeholder="Paste URL of the video [youtube]"
          data-testid="video-url-input"
        />

        <BaseButton
          class="post-editor-video__upload-btn"
          stretched
          data-testid="video-upload-button"
          :loading="uploading"
          :disabled="!url"
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

<script>
import { defineComponent } from 'vue';
import { generateVideoEmbedLink } from '@/utils/generate-video-embed-link';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';

export default defineComponent({
  components: {
    BaseButton,
    BaseInput,
  },
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      url: '',
      uploading: false,
    };
  },
  methods: {
    async upload() {
      this.uploading = true;
      if (typeof this.url === 'string') {
        this.url = generateVideoEmbedLink(this.url);
        this.$emit('update:modelValue', this.url);
      } else {
        this.url = '';
        this.$store.dispatch('showErrorNotification', {
          message:
            'Something went wrong during upload of this video. Please try to upload the video again.',
        });
      }
      this.uploading = false;
    },
    error() {
      this.$store.dispatch('showErrorNotification', {
        error: {
          message:
            'The video link you provided could not be loaded. Please try a different one.',
        },
      });

      this.url = '';
    },
  },
});
</script>

<style lang="scss">
@import '@/styles/mixins';

.post-editor-video {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;

  @include for-size(phone-only) {
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
