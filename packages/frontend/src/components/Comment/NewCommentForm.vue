<template>
  <div
    class="new-comment-form"
    :class="!userStore.user ? 'new-comment-form--disabled' : ''"
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

<script lang="ts" setup>
import { ref } from 'vue';
import type { Comment } from './types';
import { api } from '@/api';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';

type Props = {
  postId: string;
};

const props = defineProps<Props>();

type Emits = {
  'new-comment': [Comment];
};

const emit = defineEmits<Emits>();

const userStore = useUserStore();

const notificationsStore = useNotificationsStore();

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
        id: user.id,
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

<style lang="scss">
@use '@/styles/mixins';

.new-comment-form {
  padding: 1rem;
  padding-top: 0;

  @include mixins.for-size(phone-only) {
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
