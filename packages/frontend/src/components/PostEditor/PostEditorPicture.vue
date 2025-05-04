<template>
  <div
    class="post-editor-picture"
    :class="modelValue ? 'post-editor-picture--uploaded' : ''"
  >
    <div v-if="!modelValue" class="post-editor-picture__container">
      <BaseUploadForm v-model="file" class="post-editor-picture__upload-form" />

      <div class="post-editor-picture__or">OR</div>

      <div class="post-editor-picture__input-url">
        <BaseInput
          v-model.lazy="imageUrl"
          :disabled="Boolean(file)"
          placeholder="Paste URL"
          data-testid="image-url-input"
        />

        <BaseButton
          class="post-editor-picture__upload-btn"
          data-testid="image-upload-button"
          stretched
          :loading="uploading"
          :disabled="!imageUrl"
          @click="upload"
        >
          Upload
        </BaseButton>
      </div>

      <!-- A way to check if the image is inserted successfully -->
      <img
        v-if="!file && imageUrl"
        hidden
        :src="imageUrl"
        alt="error"
        @error="error()"
      />
    </div>

    <div v-else class="post-editor-picture__image">
      <img
        :src="resolveImage(modelValue)"
        :alt="modelValue"
        @error="resolveImageError"
      />
    </div>
  </div>
</template>

<script>
import api from '@/api';
import { resolveImage } from '@/utils/resolve-image';
import { resolveImageError } from '@/utils/resolve-image-error';
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
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'set-section'],
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
    resolveImage,
    resolveImageError,
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

        // an error occurred
        if (!res || !res.data.url) {
          this.reset();

          return;
        }

        this.$emit('update:modelValue', res.data.url);
        this.$emit('set-section', res.data);

        return;
      }

      this.$emit('update:modelValue', this.imageUrl);
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
@import '@/styles/mixins';

.post-editor-picture {
  width: 100%;
  padding: 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;

  @include for-size(phone-only) {
    border-right: none;
    border-left: none;
    border-radius: 0;
  }

  &--uploaded {
    padding: 0;
  }

  &__upload-form {
    margin-bottom: 12px;
  }

  &__or {
    margin-bottom: 12px;
    color: var(--color-gray-light);
    text-align: center;
    font-weight: bold;
  }

  &__upload-btn {
    margin-top: 20px;
  }

  &__image {
    display: flex;
    flex-flow: row nowrap;

    img {
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }
  }
}
</style>
