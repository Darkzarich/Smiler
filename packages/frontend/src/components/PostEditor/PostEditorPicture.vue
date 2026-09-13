<template>
  <div
    class="post-editor-picture"
    :class="value ? 'post-editor-picture--uploaded' : ''"
  >
    <div
      v-if="!value"
      ref="container"
      class="post-editor-picture__container"
      :class="{ 'post-editor-picture__container--dragging': isDraggingOver }"
      data-testid="picture-dropzone"
    >
      <BaseUploadForm
        v-model:dragging-over="isDraggingOver"
        class="post-editor-picture__upload-form"
        :accept="POST_PICTURE_ALLOWED_MIME_TYPES"
        :disabled="isUploading"
        :drop-zone="container"
        @select="uploadFile"
      />

      <div class="post-editor-picture__or">OR</div>

      <div class="post-editor-picture__input-url">
        <BaseInput
          v-model.lazy="imageUrlInput"
          :disabled="isUploading"
          placeholder="Paste URL"
          data-testid="image-url-input"
        />

        <BaseButton
          class="post-editor-picture__upload-btn"
          data-testid="image-upload-button"
          stretched
          :loading="isUploading"
          :disabled="!imageUrlInput"
          @click="uploadUrl"
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
import { ref, useTemplateRef } from 'vue';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { POST_PICTURE_ALLOWED_MIME_TYPES } from '@/const';
import { useNotificationsStore } from '@/store/notifications';
import { resolveImage } from '@/utils/resolve-image';
import { resolveImageError } from '@/utils/resolve-image-error';
import { validatePictureFile } from '@/utils/validate-picture-file';
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

const notificationsStore = useNotificationsStore();

const imageUrlInput = ref('');

const isUploading = ref(false);

const container = useTemplateRef<HTMLElement>('container');

const isDraggingOver = ref(false);

/** A pasted link is not an attachment yet - the backend downloads it, optimizes
 * it and stores it, the same as it does for a file - so both ways of adding a
 * picture end at the same section pointing at our own uploads.
 */
const uploadUrl = async () => {
  await createSectionWithAttachment(() =>
    api.posts.uploadAttachmentByUrl({ url: imageUrlInput.value }),
  );
};

const uploadFile = async (file: File) => {
  const error = validatePictureFile(file);

  if (error) {
    notificationsStore.showErrorNotification({ message: error });

    return;
  }

  const formData = new FormData();

  formData.append('picture', file);

  await createSectionWithAttachment(() => api.posts.uploadAttachment(formData));
};

const createSectionWithAttachment = async (
  upload: () => Promise<postTypes.PostPictureSection>,
) => {
  isUploading.value = true;

  try {
    const newSection = await upload();

    value.value = newSection.url;

    emit('update-section', newSection);
  } catch {
    // The api client already showed the reason the backend gave - that a url
    // did not return a picture, or that the file was too big - so there is
    // nothing to add here beyond clearing the form.
  } finally {
    imageUrlInput.value = '';
    isUploading.value = false;
  }
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

  &__container {
    padding: 4px;
    border: 2px dashed transparent;
    border-radius: 8px;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;

    /* The whole empty section takes the drop, so the whole empty section is what
       lights up — the upload box alone would be a needlessly small target. */
    &--dragging {
      border-style: solid;
      border-color: var(--color-primary);
      background: var(--color-accent-transparent);
    }
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
