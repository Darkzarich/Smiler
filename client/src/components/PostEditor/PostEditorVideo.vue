<template>
  <div class="post-video-upload">
    <div class="post-video-upload__container" v-if="!value">
      <div class="post-video-upload__input-url">
        <input-element
          v-model.lazy="url"
          placeholder="Paste URL of the video [youtube]"
          data-testid="video-url-input"
        />
        <button-element
          data-testid="video-upload-button"
          :callback="upload"
          :loading="uploading"
          :disabled="!url"
        >
          Upload
        </button-element>
      </div>
    </div>
    <div v-else class="post-video-upload__video">
      <iframe
        title="video"
        :src="value"
        frameborder="0"
        width="560"
        height="315"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen />
    </div>
  </div>
</template>

<script>
import inputElement from '../BasicElements/InputElement.vue';
import buttonElement from '../BasicElements/ButtonElement.vue';

export default {
  components: {
    buttonElement,
    inputElement,
  },
  data() {
    return {
      url: '',
      uploading: false,
    };
  },
  props: {
    value: {
      type: String,
      default: '',
    },
  },
  methods: {
    async upload() {
      this.uploading = true;
      if (typeof this.url === 'string') {
        this.url = this.$videoGenerateEmbedLink(this.url);
        this.$emit('input', this.url);
      } else {
        this.url = '';
        this.$store.dispatch('newSystemNotification', {
          error: {
            message: 'Something went wrong while uploading your video. Please, put the video in again.',
          },
        });
      }
      this.uploading = false;
    },
    error() {
      this.$store.dispatch('newSystemNotification', {
        error: {
          message: 'Invalid video link',
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
      flex-direction: row;
      flex-wrap: nowrap;
      border: 1px solid $light-gray;
      video, iframe {
        width: 100%;
      }
    }
  }
</style>
