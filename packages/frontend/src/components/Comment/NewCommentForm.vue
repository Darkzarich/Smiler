<template>
  <div
    class="new-comment-form"
    :class="!user ? 'new-comment-form--disabled' : ''"
    data-testid="new-comment-form"
  >
    <template v-if="user">
      <div class="new-comment-form__title">Share your thoughts!</div>
      <BaseTextEditor
        v-model="commentBody"
        data-testid="new-comment-form-editor"
        class="new-comment-form__editor"
      >
        <BaseButton
          class="new-comment-form__submit-btn"
          :loading="isLoading"
          data-testid="new-comment-button"
          @click="createComment"
        >
          Send
        </BaseButton>
      </BaseTextEditor>
    </template>
    <template v-else>
      Please <b>sign in</b> or <b>create an account</b> to leave a comment.
    </template>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia';
import { defineComponent } from 'vue';
import { api } from '@/api';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';

export default defineComponent({
  components: {
    BaseButton,
    BaseTextEditor,
  },
  props: {
    postId: {
      type: String,
      required: true,
    },
  },
  emits: ['new-comment'],
  data() {
    return {
      commentBody: '',
      isLoading: false,
    };
  },
  computed: {
    ...mapState(useUserStore, ['user']),
  },
  methods: {
    ...mapActions(useNotificationsStore, ['showErrorNotification']),
    async createComment() {
      if (!this.commentBody || !this.user) {
        this.showErrorNotification({
          message: 'Comment cannot be empty. Enter some text first!',
        });

        return;
      }

      try {
        this.isLoading = true;

        const data = await api.comments.createComment({
          post: this.postId,
          body: this.commentBody,
        });

        const newComment = {
          ...data,
          rated: {
            isRated: false,
            negative: false,
          },
          author: {
            avatar: this.user.avatar,
            login: this.user.login,
          },
          created: true,
        };

        this.$emit('new-comment', newComment);

        this.commentBody = '';
      } finally {
        this.isLoading = false;
      }
    },
  },
});
</script>

<style lang="scss">
@import '@/styles/mixins';

.new-comment-form {
  padding: 1rem;
  padding-top: 0;

  @include for-size(phone-only) {
    padding: 0;
  }

  &--disabled {
    padding-top: 1rem;
    border: 1px solid var(--color-gray-light);
    background: var(--color-widget-bg);
    color: var(--color-main-text);
  }

  &__title {
    margin-bottom: 1rem;
    color: var(--color-main-text);
    text-align: center;
    font-size: 1.2rem;
  }

  .base-text-editor__contenteditable {
    min-height: 120px;
  }

  &__submit-btn {
    width: 140px;
    margin-top: 20px;
  }
}
</style>
