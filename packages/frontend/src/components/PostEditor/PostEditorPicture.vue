<template>
  <div
    class="post-editor-picture"
    :class="value ? 'post-editor-picture--uploaded' : ''"
  >
    <div v-if="!value" class="post-editor-picture__container">
      <BaseUploadForm v-model="file" class="post-editor-picture__upload-form" />

      <div class="post-editor-picture__or">OR</div>

      <div class="post-editor-picture__input-url">
        <BaseInput
          v-model.lazy="imageUrlInput"
          :disabled="Boolean(file)"
          placeholder="Paste URL"
          data-testid="image-url-input"
        />

        <BaseButton
          class="post-editor-picture__upload-btn"
          data-testid="image-upload-button"
          stretched
          :loading="isUploading"
          :disabled="!imageUrlInput"
          @click="createSectionWithAttachment"
        >
          Upload
        </BaseButton>
      </div>
    </div>

    <div v-else class="post-editor-picture__image">
      <img
        :src="resolveImage(value)"
        alt="Post attachment"
        referrerpolicy="no-referrer"
        @error="resolveImageError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { resolveImage } from '@/utils/resolve-image';
import { resolveImageError } from '@/utils/resolve-image-error';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseUploadForm from '@common/BaseUploadForm.vue';

interface Emits {
  'update-section': [postTypes.PostPictureSection];
}

const emit = defineEmits<Emits>();

const value = defineModel<string>({
  default: '',
});

const imageUrlInput = ref('');

const isUploading = ref(false);

const file = ref<File | null>(null);

watch(file, (newFile) => {
  if (newFile) {
    // Show the name of the uploaded file
    imageUrlInput.value = newFile.name;
  }
});

/** A pasted link is not an attachment yet — the backend downloads it, optimizes
 * it and stores it, the same as it does for a file — so both ways of adding a
 * picture end at the same section pointing at our own uploads.
 */
const createSectionWithAttachment = async () => {
  isUploading.value = true;

  try {
    let newSection: postTypes.PostPictureSection;

    if (file.value) {
      const formData = new FormData();

      formData.append('picture', file.value);

      newSection = await api.posts.uploadAttachment(formData);
    } else {
      newSection = await api.posts.uploadAttachmentByUrl({
        url: imageUrlInput.value,
      });
    }

    value.value = newSection.url;

    emit('update-section', newSection);
  } catch {
    // The api client already showed the reason the backend gave — that a url
    // did not return a picture, or that the file was too big — so there is
    // nothing to add here beyond clearing the form.
  } finally {
    resetFormState();

    isUploading.value = false;
  }
};

const resetFormState = () => {
  file.value = null;
  imageUrlInput.value = '';
};
</script>

<style>
.post-editor-picture {
  width: 100%;
  padding: 16px;
  border: 1px solid var(--color-text-secondary);
  border-radius: 8px;

  @media (--phone-only) {
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
    color: var(--color-text-secondary);
    text-align: center;
    font-weight: bold;
  }

  &__upload-btn {
    margin-top: 20px;
  }

  &__image {
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    max-height: min(520px, 70vh);
    border-radius: 8px;
    background: var(--color-surface-primary);
    overflow: hidden;

    img {
      width: 100%;
      height: auto;
      max-height: min(520px, 70vh);
      object-fit: contain;
    }
  }
}
</style>
