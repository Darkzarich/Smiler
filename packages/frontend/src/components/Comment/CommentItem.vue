<template>
  <div class="comment-item">
    <div
      class="comment-item__content"
      :class="{
        'comment-item__content--created': Boolean(comment.created),
      }"
    >
      <div class="comment-item__header">
        <template v-if="!comment.deleted">
          <div
            class="comment-item__rating"
            :data-testid="`comment-${comment._id}-rating`"
          >
            {{ comment.rating }}
          </div>

          <BaseIconButton
            label="Upvote"
            :data-testid="`comment-${comment._id}-upvote`"
            tone="primary"
            :pressed="comment.rated.isRated && !comment.rated.negative"
            @click="upvote()"
          >
            <IconPlus />
          </BaseIconButton>

          <BaseIconButton
            label="Downvote"
            :data-testid="`comment-${comment._id}-downvote`"
            tone="danger"
            :pressed="comment.rated.isRated && comment.rated.negative"
            @click="downvote()"
          >
            <IconMinus />
          </BaseIconButton>

          <RouterLink
            :to="{
              name: 'UserPage',
              params: {
                login: comment.author.login,
              },
            }"
          >
            <div class="comment-item__author">
              {{ comment.author.login }}
            </div>

            <div class="comment-item__avatar">
              <img
                :src="resolveAvatar(comment.author.avatar)"
                alt="avatar"
                referrerpolicy="no-referrer"
              />
            </div>
          </RouterLink>

          <template v-if="checkCanEditComment(comment, userStore.user?._id)">
            <BaseIconButton
              class="comment-item__edit-btn"
              label="Edit comment"
              :data-testid="`comment-${comment._id}-edit`"
              tone="primary"
              :pressed="isEditToggled"
              @click="toggleEdit()"
            >
              <IconEdit />
            </BaseIconButton>

            <BaseIconButton
              label="Delete comment"
              :data-testid="`comment-${comment._id}-delete`"
              tone="danger"
              @click="handleDeleteComment()"
            >
              <IconDelete />
            </BaseIconButton>
          </template>
        </template>

        <div
          class="comment-item__created-at"
          :data-testid="`comment-${comment._id}-date`"
        >
          {{ formatFromNow(comment.createdAt) }}
        </div>
      </div>

      <div
        class="comment-item__body"
        :data-testid="`comment-${comment._id}-body`"
      >
        <template v-if="comment.deleted">
          <i>This comment has been deleted</i>
        </template>

        <!-- TODO: Make only one CommentForm form -->
        <CommentForm
          v-else-if="isEditToggled"
          v-model="editBody"
          class="comment-item__comment-form"
          :loading="isRequesting"
          data-testid="comment-edit"
          @submit="handleEdit()"
          @close="toggleEdit"
        />

        <template v-else>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="rich-text" v-html="comment.body" />

          <div class="comment-item__reply">
            <CommentForm
              v-if="isReplyToggled"
              v-model="replyBody"
              class="comment-item__comment-form"
              :loading="isRequesting"
              data-testid="comment-reply"
              @submit="handleReply()"
              @close="toggleReply"
            />

            <template v-else-if="level < COMMENTS_NESTED_LIMIT">
              <div
                class="comment-item__reply-toggler"
                :data-testid="`comment-${comment._id}-toggle-reply`"
                role="button"
                tabindex="0"
                @click="toggleReply()"
                @keydown.enter="toggleReply()"
                @keydown.space.prevent="toggleReply()"
              >
                Reply
              </div>
            </template>
          </div>
        </template>
      </div>

      <CommentChildExpander
        v-if="comment.children.length > 0"
        :data-testid="`comment-${comment._id}-expander`"
        :is-expanded="isChildrenExpanded"
        role="button"
        tabindex="0"
        @click="isChildrenExpanded = !isChildrenExpanded"
        @keydown.enter="isChildrenExpanded = !isChildrenExpanded"
        @keydown.space.prevent="isChildrenExpanded = !isChildrenExpanded"
      />
    </div>

    <div v-if="isChildrenExpanded" class="comment-item__replies">
      <CommentItem
        v-for="childComment in comment.children"
        :key="childComment._id"
        :comment="childComment"
        :post-id="postId"
        :level="level + 1"
        @remove="handleRemoveComment"
        @reply-created="emit('reply-created')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es';
import { ref } from 'vue';
import CommentChildExpander from './CommentChildExpander.vue';
import CommentForm from './CommentForm.vue';
import type { Comment } from './types';
import { api } from '@/api';
import {
  COMMENT_RATE_VALUE,
  COMMENT_AUTO_HIDE_LEVEL,
  COMMENTS_NESTED_LIMIT,
} from '@/const';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { checkCanEditComment } from '@/utils/check-can-edit-comment';
import { formatFromNow } from '@/utils/format-from-now';
import { resolveAvatar } from '@/utils/resolve-avatar';
import BaseIconButton from '@common/BaseIconButton.vue';
import IconDelete from '@icons/IconDelete.vue';
import IconEdit from '@icons/IconEdit.vue';
import IconMinus from '@icons/IconMinus.vue';
import IconPlus from '@icons/IconPlus.vue';

interface Props {
  postId: string;
  comment: Comment;
  level?: number;
}

const props = withDefaults(defineProps<Props>(), {
  level: 1,
});

interface Emits {
  remove: [id: string];
  'reply-created': [];
}

const emit = defineEmits<Emits>();

const userStore = useUserStore();

const notificationsStore = useNotificationsStore();

const authPrompt = useAuthPromptStore();

const comment = ref(props.comment);

const isRequesting = ref(false);

const isChildrenExpanded = ref(props.level <= COMMENT_AUTO_HIDE_LEVEL);

// replyBody and editBody potentially can be optimized by using a single one of them

const replyBody = ref('');
const isReplyToggled = ref(false);

const toggleReply = async () => {
  if (!(await authPrompt.ensureSignedIn({ title: 'Sign in to reply' }))) {
    return;
  }

  isReplyToggled.value = !isReplyToggled.value;
};

const handleReply = async () => {
  const user = userStore.user;

  if (!replyBody.value || !user) {
    notificationsStore.showErrorNotification({
      message: 'Comment cannot be empty. Enter some text first!',
    });

    return;
  }

  try {
    isRequesting.value = true;

    const data = await api.comments.createComment({
      post: props.postId,
      parent: comment.value._id,
      body: replyBody.value,
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

    comment.value.children.unshift(newComment);

    emit('reply-created');

    replyBody.value = '';
    toggleReply();
  } finally {
    isRequesting.value = false;
  }
};

const editBody = ref('');
const isEditToggled = ref(false);

const toggleEdit = () => {
  editBody.value = comment.value.body;
  isEditToggled.value = !isEditToggled.value;
};

const handleEdit = async () => {
  try {
    isRequesting.value = true;

    const data = await api.comments.updateComment(comment.value._id, {
      body: editBody.value,
    });

    comment.value = {
      ...comment.value,
      ...data,
    };

    toggleEdit();
  } finally {
    isRequesting.value = false;
  }
};

const handleDeleteComment = async () => {
  if (isRequesting.value) {
    return;
  }

  try {
    isRequesting.value = true;

    const { _id } = comment.value;

    await api.comments.deleteComment(_id);

    if (!comment.value.children?.length) {
      emit('remove', _id);

      return;
    }

    comment.value.deleted = true;
  } finally {
    isRequesting.value = false;
  }
};

const handleRemoveComment = (id: string) => {
  const commentIndex = comment.value.children.findIndex(
    (comment) => comment._id === id,
  );

  if (commentIndex === -1) {
    return;
  }

  comment.value.children.splice(commentIndex, 1);

  emit('remove', id);
};

const handleRemoveVote = async () => {
  isRequesting.value = true;

  const rateValue = comment.value.rated.negative
    ? COMMENT_RATE_VALUE
    : -COMMENT_RATE_VALUE;

  const prevCommentState = cloneDeep(comment.value);

  try {
    // Optimistic update
    comment.value = {
      ...comment.value,
      rated: {
        negative: comment.value.rated.negative,
        isRated: false,
      },
      rating: comment.value.rating + rateValue,
    };

    const data = await api.comments.removeRate(comment.value._id);

    comment.value = {
      ...comment.value,
      rating: data.rating,
    };
  } catch {
    comment.value = prevCommentState;
  } finally {
    isRequesting.value = false;
  }
};

const upvote = async () => {
  if (isRequesting.value) {
    return;
  }

  // Not resumed after sign in: this comment was loaded without the account's vote
  if (!userStore.user) {
    void authPrompt.open({ title: 'Sign in to vote' });

    return;
  }

  if (comment.value.rated.isRated && !comment.value.rated.negative) {
    return handleRemoveVote();
  }

  isRequesting.value = true;

  const rateValue = comment.value.rated.isRated
    ? COMMENT_RATE_VALUE * 2
    : COMMENT_RATE_VALUE;

  const prevCommentState = cloneDeep(comment.value);

  try {
    // Optimistic update
    comment.value = {
      ...comment.value,
      rated: {
        ...comment.value.rated,
        isRated: true,
        negative: false,
      },
      rating: comment.value.rating + rateValue,
    };

    const data = await api.comments.updateRateById(comment.value._id, {
      negative: false,
    });

    comment.value = {
      ...comment.value,
      rating: data.rating,
    };
  } catch {
    comment.value = prevCommentState;
  } finally {
    isRequesting.value = false;
  }
};

const downvote = async () => {
  if (isRequesting.value) {
    return;
  }

  // Not resumed after sign in: this comment was loaded without the account's vote
  if (!userStore.user) {
    void authPrompt.open({ title: 'Sign in to vote' });

    return;
  }

  if (comment.value.rated.isRated && comment.value.rated.negative) {
    return handleRemoveVote();
  }

  isRequesting.value = true;

  const rateValue = comment.value.rated.isRated
    ? COMMENT_RATE_VALUE * 2
    : COMMENT_RATE_VALUE;

  const prevCommentState = cloneDeep(comment.value);

  try {
    // Optimistic update
    comment.value = {
      ...comment.value,
      rated: {
        ...comment.value.rated,
        isRated: true,
        negative: true,
      },
      rating: comment.value.rating - rateValue,
    };

    const data = await api.comments.updateRateById(comment.value._id, {
      negative: true,
    });

    comment.value = {
      ...comment.value,
      rating: data.rating,
    };
  } catch {
    comment.value = prevCommentState;
  } finally {
    isRequesting.value = false;
  }
};
</script>

<style>
.comment-item {
  color: var(--color-text-primary);

  &__content {
    margin: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: var(--color-surface-secondary);

    @media (--phone-only) {
      margin-right: 0;
    }

    &--created {
      animation: flash 1s ease-out;

      @keyframes flash {
        0% {
          background: var(--color-accent-transparent);
        }

        100% {
          background: var(--color-surface-secondary);
        }
      }
    }
  }

  &__header {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 8px;

    /* Neighboring icon buttons, so that their 44px hit areas meet only in the gap */
    @media (--pointer-coarse) {
      .base-icon-button + .base-icon-button {
        margin-left: 8px;
      }
    }

    a {
      display: flex;
      color: var(--color-text-primary);
      text-decoration: none;
    }
  }

  &__avatar img {
    width: 1rem;
    height: 1rem;
    margin-left: 0.5rem;
    border-radius: 50%;
  }

  &__rating {
    margin-right: 4px;
    color: var(--color-text-secondary);
  }

  &__edit-btn {
    margin-left: 0.5rem;
  }

  &__created-at {
    margin-left: 0.5rem;
    color: var(--color-text-secondary);
  }

  &__body {
    line-height: 1.5rem;
  }

  &__comment-form {
    margin-top: 16px;
  }

  &__reply-toggler {
    display: inline-block;
    margin-top: 8px;
    color: var(--color-primary);
    font-size: 0.9rem;
    cursor: pointer;
    font-weight: bold;
    transition: color 0.2s ease;
    transition: all 200ms ease-out;

    &:hover {
      filter: brightness(120%);
    }
  }

  &__replies {
    margin-left: 19.5px;
    padding-left: 8px;
    border-left: solid 1px var(--color-text-secondary);
  }
}
</style>
