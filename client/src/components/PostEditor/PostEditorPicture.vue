<template>
<div class="post-image-upload">
  <upload-element
    v-model="file"
  />
  <div class="post-image-upload__or">
      OR
  </div>
  <div class="post-image-upload__input-url">
    <input-element
      v-model.lazy="file"
      place-holder="Paste URL"
    />
    <button-element
      :callback="upload"
      :loading="uploading"
      :disabled="!file"
    >
      Upload
    </button-element>
  </div>
  <img
    hidden
    v-if="file"
    :src="file"
    @error="error()"
  >
</div>
</template>

<script>
import inputElement from '../BasicElements/InputElement';
import buttonElement from '../BasicElements/ButtonElement';
import uploadElement from '../BasicElements/UploadElement';

import api from '@/api';

export default {
  components: {
    uploadElement,
    buttonElement,
    inputElement,
  },
  data() {
    return {
      file: '',
      uploading: false,
    };
  },
  props: {
    value: {
      type: String,
    },
  },
  methods: {
    async upload() {
      this.uploading = true;
      if (this.file instanceof File) {
        const formData = new FormData();

        formData.append('attachments', this.file);

        const res = await api.posts.uploadAttachment(formData);

        if (res.data.error) {
          this.file = '';
        } else {
          this.$emit('input', res.data.files[0]);
        }
      } else if (typeof this.file === 'string') {
        const res = await api.posts.uploadAttachmentLink();
        if (res.data.error) {
          this.file = '';
        } else {
          this.$emit('input', res.data.files[0]);
        }
      } else {
        this.file = '';
        this.$store.dispatch('newSystemNotification', {
          error: {
            message: 'Something went wrong while uploading file. Please, put the file in again.',
          },
        });
      }
      this.uploading = false;
    },
    error() {
      if (!(this.file instanceof File)) {
        console.log('error');

        this.$store.dispatch('newSystemNotification', {
          error: {
            message: 'Invalid image link',
          },
        });

        this.file = '';
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

  .post-image-upload {
    padding: 1rem;
    border: 1px solid $light-gray;
    width: 100%;
    &__or {
      text-align: center;
      font-weight: bold;
      color: $firm;
    }
  }
</style>
