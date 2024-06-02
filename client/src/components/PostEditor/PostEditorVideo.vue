<template>
  <div class="post-video-upload">
    <div v-if="!value" class="post-video-upload__container">
      <div class="post-video-upload__input-url">
        <BaseInput
          v-model.lazy="url"
          placeholder="Paste URL of the video [youtube]"
          data-testid="video-url-input"
        />
        <BaseButton
          data-testid="video-upload-button"
          :callback="upload"
          :loading="uploading"
          :disabled="!url"
        >
          Upload
        </BaseButton>
      </div>
    </div>
    <div
      v-else
      class="post-video-upload__video"
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
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';

export default {
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
        this.url = this.$videoGenerateEmbedLink(this.url);
        this.$emit('input', this.url);
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
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.post-video-upload {
  width: 100%;
  padding: 1rem;
  border: 1px solid $light-gray;

  &__or {
    color: $firm;
    text-align: center;
    font-weight: bold;
  }

  &__video {
    display: flex;
    flex-flow: row nowrap;
    border: 1px solid $light-gray;

    video,
    iframe {
      width: 100%;
    }
  }
}
</style>
