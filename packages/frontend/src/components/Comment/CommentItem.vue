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
            :data-testid="`comment-${comment.id}-rating`"
          >
            {{ comment.rating }}
          </div>

          <div
            class="comment-item__upvote-btn"
            :data-testid="`comment-${comment.id}-upvote`"
            :class="
              comment.rated.isRated && !comment.rated.negative
                ? 'comment-item__upvote-btn--active'
                : ''
            "
            @click="handleUpvote()"
          >
            <IconPlus />
          </div>

          <div
            :data-testid="`comment-${comment.id}-downvote`"
            class="comment-item__downvote-btn"
            :class="
              comment.rated.isRated && comment.rated.negative
                ? 'comment-item__downvote-btn--active'
                : ''
            "
            @click="handleDownvote()"
          >
            <IconMinus />
          </div>

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
                :alt="comment.author.avatar"
              />
            </div>
          </RouterLink>

          <template v-if="checkCanEditComment(comment, userStore.user?.id)">
            <div
              class="comment-item__edit-btn"
              :data-testid="`comment-${comment.id}-edit`"
              @click="toggleEdit()"
            >
              <IconEdit />
            </div>

            <div
              class="comment-item__delete-btn"
              :data-testid="`comment-${comment.id}-delete`"
              @click="handleDeleteComment()"
            >
              <IconDelete />
            </div>
          </template>
        </template>

        <div
          class="comment-item__created-at"
          :data-testid="`comment-${comment.id}-date`"
        >
          {{ formatFromNow(comment.createdAt) }}
        </div>
      </div>

      <div
        class="comment-item__body"
        :data-testid="`comment-${comment.id}-body`"
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
          <div v-html="comment.body" />

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

            <template v-else-if="level < consts.COMMENTS_NESTED_LIMIT">
              <div
                :class="{
                  'comment-item__reply-toggler--disabled': !userStore.user,
                }"
                class="comment-item__reply-toggler"
                :data-testid="`comment-${comment.id}-toggle-reply`"
                @click="toggleReply()"
              >
                Reply
              </div>
            </template>
          </div>
        </template>
      </div>

      <CommentChildExpander
        v-if="comment.children.length > 0"
        :data-testid="`comment-${comment.id}-expander`"
        :is-expanded="isChildrenExpanded"
        @click="isChildrenExpanded = !isChildrenExpanded"
      />
    </div>

    <div v-if="isChildrenExpanded" class="comment-item__replies">
      <CommentItem
        v-for="childComment in comment.children"
        :key="childComment.id"
        :comment="childComment"
        :post-id="postId"
        :level="level + 1"
        @remove="handleRemoveComment"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CommentChildExpander from './CommentChildExpander.vue';
import CommentForm from './CommentForm.vue';
import type { Comment } from './types';
import { api } from '@/api';
import * as consts from '@/const';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { checkCanEditComment } from '@/utils/check-can-edit-comment';
import { formatFromNow } from '@/utils/format-from-now';
import { resolveAvatar } from '@/utils/resolve-avatar';
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
}

const emit = defineEmits<Emits>();

const userStore = useUserStore();

const notificationsStore = useNotificationsStore();

const comment = ref(props.comment);

const isRequesting = ref(false);

const isChildrenExpanded = ref(props.level <= consts.COMMENT_AUTO_HIDE_LEVEL);

// replyBody and editBody potentially can be optimized by using a single one of them

const replyBody = ref('');
const isReplyToggled = ref(false);

const toggleReply = () => {
  if (!userStore.user) {
    notificationsStore.showErrorNotification({
      message: 'Please sign in or create an account to leave a reply.',
    });

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
      parent: comment.value.id,
      body: replyBody.value,
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

    comment.value.children.unshift(newComment);

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

    const data = await api.comments.updateComment(comment.value.id, {
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

// TODO: Changing post comment count on delete
const handleDeleteComment = async () => {
  if (isRequesting.value) {
    return;
  }

  try {
    isRequesting.value = true;

    const { id } = comment.value;

    await api.comments.deleteComment(id);

    if (!comment.value.children?.length) {
      emit('remove', id);

      return;
    }

    comment.value.deleted = true;
  } finally {
    isRequesting.value = false;
  }
};

const handleRemoveComment = (id: string) => {
  const commentIndex = comment.value.children.findIndex(
    (comment) => comment.id === id,
  );

  if (commentIndex === -1) {
    return;
  }

  comment.value.children.splice(commentIndex, 1);
};

const handleUpvote = async () => {
  // TODO: Maybe if a user clicks downvote after upvote
  // it should fully apply that downvote and not through intermediate state

  if (isRequesting.value) {
    return;
  }

  isRequesting.value = true;

  if (!comment.value.rated.isRated) {
    // Optimistic update
    try {
      comment.value.rated.isRated = true;
      comment.value.rated.negative = false;
      comment.value.rating = comment.value.rating + consts.COMMENT_RATE_VALUE;

      const data = await api.comments.updateRateById(comment.value.id, {
        negative: false,
      });

      comment.value = {
        ...comment.value,
        rating: data.rating,
        deleted: data.deleted,
      };
    } catch {
      comment.value.rated.isRated = false;
      comment.value.rating = comment.value.rating - consts.COMMENT_RATE_VALUE;
    } finally {
      isRequesting.value = false;
    }

    return;
  }

  if (comment.value.rated.negative) {
    // Optimistic update
    try {
      comment.value.rated.isRated = false;
      comment.value.rating = comment.value.rating + consts.COMMENT_RATE_VALUE;

      const data = await api.comments.removeRate(comment.value.id);

      comment.value = {
        ...comment.value,
        rating: data.rating,
        deleted: data.deleted,
      };
    } catch {
      comment.value.rated.isRated = true;
      comment.value.rating = comment.value.rating - consts.COMMENT_RATE_VALUE;
    } finally {
      isRequesting.value = false;
    }

    return;
  }
};

const handleDownvote = async () => {
  if (isRequesting.value) {
    return;
  }

  isRequesting.value = true;

  if (!comment.value.rated.isRated) {
    try {
      comment.value.rated.isRated = true;
      comment.value.rated.negative = true;
      comment.value.rating = comment.value.rating - consts.COMMENT_RATE_VALUE;

      const data = await api.comments.updateRateById(comment.value.id, {
        negative: true,
      });

      comment.value = {
        ...comment.value,
        rating: data.rating,
        deleted: data.deleted,
      };
    } catch {
      comment.value.rated.isRated = false;
      comment.value.rating = comment.value.rating + consts.COMMENT_RATE_VALUE;
    } finally {
      isRequesting.value = false;
    }

    return;
  }

  if (!comment.value.rated.negative) {
    try {
      comment.value.rated.isRated = false;
      comment.value.rating = comment.value.rating - consts.COMMENT_RATE_VALUE;

      const data = await api.comments.removeRate(comment.value.id);

      comment.value = {
        ...comment.value,
        rating: data.rating,
        deleted: data.deleted,
      };
    } catch {
      comment.value.rated.isRated = true;
      comment.value.rating = comment.value.rating + consts.COMMENT_RATE_VALUE;
    } finally {
      isRequesting.value = false;
    }

    return;
  }
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.comment-item {
  color: var(--color-main-text);

  &__content {
    margin: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: var(--color-widget-bg);

    @include mixins.for-size(phone-only) {
      margin-right: 0;
    }

    &--created {
      animation: flash 1s ease-out;

      @keyframes flash {
        0% {
          background: var(--color-comments-animation);
        }

        100% {
          background: var(--color-widget-bg);
        }
      }
    }
  }

  &__header {
    display: flex;
    flex-direction: row;

    a {
      display: flex;
      color: var(--color-main-text);
      text-decoration: none;
    }
  }

  &__avatar img {
    width: 1rem;
    height: 1rem;
    margin-left: 0.5rem;
    border-radius: 50%;
  }

  &__upvote-btn,
  &__rating,
  &__downvote-btn,
  &__edit-btn,
  &__delete-btn {
    color: var(--color-gray-light);
    cursor: pointer;

    svg {
      position: relative;
      top: -8px;
      width: 2rem;
      height: 2rem;
      fill: var(--color-gray-light);
      transform: scale(1.2);
    }
  }

  &__downvote-btn {
    margin-left: -0.5rem;
  }

  &__edit-btn,
  &__delete-btn {
    margin-left: 0.5rem;

    svg {
      width: 1.3rem;
      transform: scale(1);
    }
  }

  &__upvote-btn--active,
  &__upvote-btn:hover,
  &__edit:hover {
    svg {
      fill: var(--color-primary);
    }
  }

  &__downvote-btn:hover,
  &__downvote-btn--active,
  &__delete:hover {
    /* stylelint-disable-next-line no-descending-specificity */
    svg {
      cursor: pointer;
      fill: var(--color-danger);
    }
  }

  &__created-at {
    margin-left: 0.5rem;
    color: var(--color-gray-light);
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

    &--disabled {
      color: var(--color-gray-light) !important;
    }
  }

  &__replies {
    margin-left: 19.5px;
    padding-left: 8px;
    border-left: solid 1px var(--color-gray-light);
  }
}
</style>
