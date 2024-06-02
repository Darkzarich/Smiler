<template>
  <div
    class="new-comment-form"
    :class="!isUserAuth ? 'new-comment-form--disabled' : ''"
    data-testid="new-comment-form"
  >
    <template v-if="isUserAuth">
      <div class="new-comment-form__title">Share your thoughts!</div>
      <BaseTextEditor
        v-model="commentBody"
        data-testid="new-comment-form-editor"
      >
        <div class="comments__form-submit">
          <BaseButton
            :loading="loading"
            :callback="createComment"
            data-testid="new-comment-button"
          >
            Send
          </BaseButton>
        </div>
      </BaseTextEditor>
    </template>
    <template v-else>
      Please <b>sign in</b> or <b>create an account</b> to leave a comment.
    </template>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import api from '@/api';
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';

export default {
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
  data() {
    return {
      commentBody: '',
      loading: false,
    };
  },
  computed: {
    ...mapGetters(['isUserAuth']),
    ...mapState({
      user: (state) => state.user,
    }),
  },
  methods: {
    async createComment() {
      if (!this.commentBody) {
        this.$store.dispatch('showErrorNotification', {
          message: 'Comment cannot be empty. Enter some text first!',
        });

        return;
      }

      this.loading = true;

      const res = await api.comments.createComment({
        post: this.postId,
        body: this.commentBody,
      });

      if (!res.data.error) {
        const newComment = {
          ...res.data,
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
      }

      this.loading = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.new-comment-form {
  padding: 1rem;

  @include for-size(phone-only) {
    width: 100%;
    padding: 0;
  }

  &--disabled {
    border: 1px solid $light-gray;
    background: $widget-bg;
    color: $main-text;
  }

  &__title {
    color: $main-text;
    font-size: 1.2rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .text-editor {
    min-height: 6rem;
  }
}
</style>
