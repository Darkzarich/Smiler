<template>
  <div
    class="post-image-upload"
    :class="value ? 'post-image-upload_uploaded' : ''"
  >
    <div v-if="!value" class="post-image-upload__container">
      <BaseUploadForm v-model="file" />
      <div class="post-image-upload__or">OR</div>
      <div class="post-image-upload__input-url">
        <BaseInput
          v-model.lazy="imageUrl"
          :disabled="Boolean(file)"
          placeholder="Paste URL"
          data-testid="image-url-input"
        />
        <BaseButton
          data-testid="image-upload-button"
          :callback="upload"
          :loading="uploading"
          :disabled="!imageUrl"
        >
          Upload
        </BaseButton>
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
import api from '@/api';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseUploadForm from '@common/BaseUploadForm.vue';

export default {
  components: {
    BaseUploadForm,
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
        this.$store.dispatch('showErrorNotification', {
          message:
            'Something went wrong during upload of this picture. Please try to upload the picture again.',
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
        this.$store.dispatch('showErrorNotification', {
          message:
            'The image link you provided is invalid. Please try a different one.',
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
  width: 100%;
  padding: 1rem;
  border: 1px solid $light-gray;

  &_uploaded {
    padding: 0;
  }

  &__or {
    color: $firm;
    text-align: center;
    font-weight: bold;
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
