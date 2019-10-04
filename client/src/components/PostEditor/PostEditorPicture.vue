<template>
<div class="post-image-upload" :class="value ? 'post-image-upload_uploaded' : ''">
  <div class="post-image-upload__container" v-if="!value">
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
  <div v-else class="post-image-upload__image">
    <img @error="$resolveImageError" :src="$resolveImage(value)"/>
  </div>
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

        formData.append('picture', this.file);

        const res = await api.posts.uploadAttachment(formData);

        if (res.data.error) {
          this.file = '';
        } else {
          this.$emit('input', res.data.url);
          this.$emit('set-section', res.data);
        }
      } else if (typeof this.file === 'string') {
        this.$emit('input', this.file);
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
      flex-direction: row;
      flex-wrap: nowrap;
      img {
        width: 100%;
        height: 100%;
      }
    }
  }
</style>
