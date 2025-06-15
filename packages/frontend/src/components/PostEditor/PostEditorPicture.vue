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

      <!-- A way to check if the image is inserted successfully -->
      <img
        v-if="!file && imageUrlInput"
        hidden
        :src="imageUrlInput"
        alt="error"
        @error="handleImgError()"
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

<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import { useNotificationsStore } from '@/store/notifications';
import { resolveImage } from '@/utils/resolve-image';
import { resolveImageError } from '@/utils/resolve-image-error';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseUploadForm from '@common/BaseUploadForm.vue';

type Emits = {
  'add-section': [postTypes.PostPictureSection];
};

const emit = defineEmits<Emits>();

const value = defineModel<string>({
  default: '',
});

const notificationsStore = useNotificationsStore();

const imageUrlInput = ref('');

const isUploading = ref(false);

const file = ref<File | null>(null);

watch(file, (newFile) => {
  if (newFile) {
    // Show the name of the uploaded file
    imageUrlInput.value = newFile.name;
  }
});

const createSectionWithAttachment = async () => {
  if (!file.value) {
    value.value = imageUrlInput.value;

    return;
  }

  isUploading.value = true;

  try {
    const formData = new FormData();

    formData.append('picture', file.value);

    const newSection = await api.posts.uploadAttachment(formData);

    emit('add-section', newSection);

    value.value = newSection.url;
  } catch {
    notificationsStore.showErrorNotification({
      message:
        'Something went wrong during upload of this picture. Please try to upload the picture again.',
    });
  } finally {
    resetFormState();

    isUploading.value = false;
  }
};

const handleImgError = () => {
  // TODO: Do I need this?
  if (!file.value) {
    notificationsStore.showErrorNotification({
      message:
        'The image link you provided is invalid. Please try a different one.',
    });

    resetFormState();
  }
};

const resetFormState = () => {
  file.value = null;
  imageUrlInput.value = '';
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.post-editor-picture {
  width: 100%;
  padding: 16px;
  border: 1px solid var(--color-gray-light);
  border-radius: 8px;

  @include mixins.for-size(phone-only) {
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
