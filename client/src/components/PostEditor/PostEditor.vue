<template>
  <div class="post-editor">
    <input-element
      :place-holder="'Title'"
      v-model="title"
    />
    <text-editor-element
      v-model="body"
    />
    <div class="post-editor__submit">
      <button-element
        :loading="sending"
        :callback="createPost"
      >
        Create Post
      </button-element>
    </div>
  </div>
</template>

<script>
import api from '@/api';

import ButtonElement from '../BasicElements/ButtonElement.vue';
import TextEditorElement from '../BasicElements/TextEditorElement.vue';
import InputElement from '../BasicElements/InputElement.vue';

import consts from '@/const/const';

export default {
  components: {
    ButtonElement,
    InputElement,
    TextEditorElement,
  },
  data() {
    return {
      title: '',
      body: '',
      sending: false,
    };
  },
  methods: {
    async createPost() {
      console.log(this.body);
      this.sending = true;
      await api.posts.createPost({
        body: this.body,
        title: this.title,
      });
      this.sending = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.post-editor {
  &__submit {
    width: 50%;
    margin-left: 25%;
  }
}

</style>
