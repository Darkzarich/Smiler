<template>
  <div
    class="new-comment-form"
    :class="!userStore.user ? 'new-comment-form--guest' : ''"
    data-testid="new-comment-form"
  >
    <template v-if="userStore.user">
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
          type="primary"
          @click="createComment"
        >
          Send
        </BaseButton>
      </BaseTextEditor>
    </template>
    <template v-else>
      <div class="new-comment-form__title">Join the conversation</div>

      <p class="new-comment-form__guest-text">
        Sign in or create an account to leave a comment.
      </p>

      <div class="new-comment-form__guest-actions">
        <BaseButton
          size="medium"
          data-testid="new-comment-form-signin"
          type="primary"
          @click="promptAuth('signin')"
        >
          Sign in
        </BaseButton>

        <BaseButton
          size="medium"
          type="ghost"
          data-testid="new-comment-form-signup"
          @click="promptAuth('signup')"
        >
          Create an account
        </BaseButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Comment } from './types';
import { api } from '@/api';
import { type AuthPromptMode, useAuthPromptStore } from '@/store/auth-prompt';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';

interface Props {
  postId: string;
}

const props = defineProps<Props>();

interface Emits {
  'new-comment': [Comment];
}

const emit = defineEmits<Emits>();

const userStore = useUserStore();

const notificationsStore = useNotificationsStore();

const authPrompt = useAuthPromptStore();

const promptAuth = (mode: AuthPromptMode) => {
  void authPrompt.open({ title: 'Sign in to comment', mode });
};

const commentBody = ref('');

const isLoading = ref(false);

const createComment = async () => {
  const user = userStore.user;

  if (!commentBody.value || !user) {
    notificationsStore.showErrorNotification({
      message: 'Comment cannot be empty. Enter some text first!',
    });

    return;
  }

  try {
    isLoading.value = true;

    const data = await api.comments.createComment({
      post: props.postId,
      body: commentBody.value,
    });

    const newComment: Comment = {
      ...data,
      rated: {
        isRated: false,
        negative: false,
      },
      author: {
        _id: user._id,
        avatar: user.avatar,
        login: user.login,
      },
      created: true,
    };

    emit('new-comment', newComment);

    commentBody.value = '';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style>
.new-comment-form {
  padding-bottom: 1rem;

  @media (--phone-only) {
    padding: 0;
  }

  &--guest {
    padding: 24px 16px;
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--color-card-edge);
    background: var(--color-surface-secondary);
    color: var(--color-text-primary);
    text-align: center;

    @media (--phone-only) {
      border-radius: 0;
    }
  }

  &__guest-text {
    margin: -8px 0 16px;
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  &__guest-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
  }

  &__title {
    margin-bottom: 1rem;
    color: var(--color-text-primary);
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
