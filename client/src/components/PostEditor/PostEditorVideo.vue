<template>
  <div class="post-video-upload">
    <div v-if="!value" class="post-video-upload__container">
      <div class="post-video-upload__input-url">
        <InputElement
          v-model.lazy="url"
          placeholder="Paste URL of the video [youtube]"
          data-testid="video-url-input"
        />
        <ButtonElement
          data-testid="video-upload-button"
          :callback="upload"
          :loading="uploading"
          :disabled="!url"
        >
          Upload
        </ButtonElement>
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
import ButtonElement from '../BasicElements/ButtonElement.vue';
import InputElement from '../BasicElements/InputElement.vue';

export default {
  components: {
    ButtonElement,
    InputElement,
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
        this.$store.dispatch('newNotification', {
          message:
            'Something went wrong during upload of this video. Please try to upload the video again.',
        });
      }
      this.uploading = false;
    },
    error() {
      this.$store.dispatch('newNotification', {
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
  padding: 1rem;
  border: 1px solid $light-gray;
  width: 100%;

  &__or {
    text-align: center;
    font-weight: bold;
    color: $firm;
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
