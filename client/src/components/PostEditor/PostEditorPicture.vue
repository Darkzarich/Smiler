<template>
  <div
    class="post-image-upload"
    :class="value ? 'post-image-upload_uploaded' : ''"
  >
    <div v-if="!value" class="post-image-upload__container">
      <UploadElement v-model="file" />
      <div class="post-image-upload__or">OR</div>
      <div class="post-image-upload__input-url">
        <InputElement
          v-model.lazy="imageUrl"
          :disabled="Boolean(file)"
          placeholder="Paste URL"
          data-testid="image-url-input"
        />
        <ButtonElement
          data-testid="image-upload-button"
          :callback="upload"
          :loading="uploading"
          :disabled="!imageUrl"
        >
          Upload
        </ButtonElement>
      </div>
      <img
        v-if="!file && imageUrl"
        hidden
        :src="imageUrl"
        alt="error"
        @error="error()"
      />
    </div>
    <div v-else class="post-image-upload__image">
      <img
        :src="$resolveImage(value)"
        :alt="value"
        @error="$resolveImageError"
      />
    </div>
  </div>
</template>

<script>
import ButtonElement from '../BasicElements/ButtonElement.vue';
import InputElement from '../BasicElements/InputElement.vue';
import UploadElement from '../BasicElements/UploadElement.vue';
import api from '@/api';

export default {
  components: {
    UploadElement,
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
      file: null,
      imageUrl: '',
      uploading: false,
    };
  },
  watch: {
    file(newFile) {
      if (newFile instanceof File) {
        this.imageUrl = newFile.name;
      }
    },
  },
  methods: {
    async handleUpload() {
      this.uploading = true;

      try {
        await this.upload();
      } catch (e) {
        this.$store.dispatch('newSystemNotification', {
          error: {
            message:
              'Something went wrong while uploading the file. Please, try to upload the file again.',
          },
        });
      } finally {
        this.reset();
        this.uploading = false;
      }
    },
    async upload() {
      if (this.file instanceof File) {
        const formData = new FormData();

        formData.append('picture', this.file);

        const res = await api.posts.uploadAttachment(formData);

        this.$emit('input', res.data.url);
        this.$emit('set-section', res.data);

        return;
      }

      this.$emit('input', this.imageUrl);
    },
    error() {
      if (!(this.file instanceof File)) {
        this.$store.dispatch('newSystemNotification', {
          error: {
            message: 'Invalid image link',
          },
        });

        this.reset();
      }
    },
    reset() {
      this.file = null;
      this.imageUrl = '';
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.post-image-upload {
  padding: 1rem;

  &_uploaded {
    padding: 0;
  }

  border: 1px solid $light-gray;
  width: 100%;

  &__or {
    text-align: center;
    font-weight: bold;
    color: $firm;
  }

  &__image {
    display: flex;
    flex-flow: row nowrap;

    img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
