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
          <div class="comment-item__votes">
            <BaseIconButton
              label="Upvote"
              :data-testid="`comment-${comment._id}-upvote`"
              tone="primary"
              :pressed="comment.rated.isRated && !comment.rated.negative"
              @click="upvote()"
            >
              <IconPlus />
            </BaseIconButton>

            <div
              class="comment-item__rating"
              :data-testid="`comment-${comment._id}-rating`"
            >
              {{ comment.rating }}
            </div>

            <BaseIconButton
              label="Downvote"
              :data-testid="`comment-${comment._id}-downvote`"
              tone="danger"
              :pressed="comment.rated.isRated && comment.rated.negative"
              @click="downvote()"
            >
              <IconMinus />
            </BaseIconButton>
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
              <UserAvatar :src="comment.author.avatar" />
            </div>
          </RouterLink>

          <span
            v-if="answers !== undefined"
            class="comment-item__reply-to"
            :data-testid="`comment-${comment._id}-reply-to`"
          >
            ↳ {{ answers === null ? 'deleted comment' : `@${answers}` }}
          </span>

          <div
            v-if="checkCanEditComment(comment, userStore.user?._id)"
            class="comment-item__own-actions"
          >
            <BaseIconButton
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
          </div>
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

          <CommentForm
            v-if="isReplyToggled"
            v-model="replyBody"
            class="comment-item__comment-form"
            :loading="isRequesting"
            data-testid="comment-reply"
            @submit="handleReply()"
            @close="toggleReply"
          />
        </template>
      </div>

      <div v-if="canReply || hasRepliesToggle" class="comment-item__actions">
        <button
          v-if="canReply"
          type="button"
          class="comment-item__action"
          :data-testid="`comment-${comment._id}-toggle-reply`"
          @click="toggleReply()"
        >
          Reply
        </button>

        <button
          v-if="hasRepliesToggle"
          type="button"
          class="comment-item__action"
          :aria-expanded="isChildrenExpanded"
          :data-testid="`comment-${comment._id}-replies-toggle`"
          @click="isChildrenExpanded = !isChildrenExpanded"
        >
          {{ isChildrenExpanded ? 'Hide' : 'Show' }} {{ replyCount }}
          {{ replyCount === 1 ? 'reply' : 'replies' }}
        </button>
      </div>
    </div>

    <div
      v-if="hasRepliesToggle && isChildrenExpanded"
      class="comment-item__replies"
    >
      <template v-if="isThreadFlat">
        <CommentItem
          v-for="reply in flatReplies"
          :key="reply.comment._id"
          :comment="reply.comment"
          :answers="reply.answers"
          :post-id="postId"
          :level="level + 1"
          flat
        />
      </template>

      <template v-else>
        <CommentItem
          v-for="childComment in comment.children"
          :key="childComment._id"
          :comment="childComment"
          :answers="childComment.replyTo?.login"
          :post-id="postId"
          :level="level + 1"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es';
import { computed, inject, ref } from 'vue';
import CommentForm from './CommentForm.vue';
import { commentThreadKey, countReplies, flattenReplies } from './thread';
import type { Comment } from './types';
import { useVisibleDepth } from './use-visible-depth';
import { api } from '@/api';
import { useOwnVote } from '@/composables/use-own-vote';
import { COMMENT_RATE_VALUE, COMMENT_AUTO_HIDE_LEVEL } from '@/const';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import { checkCanEditComment } from '@/utils/check-can-edit-comment';
import { formatFromNow } from '@/utils/format-from-now';
import BaseIconButton from '@common/BaseIconButton.vue';
import IconDelete from '@icons/IconDelete.vue';
import IconEdit from '@icons/IconEdit.vue';
import IconMinus from '@icons/IconMinus.vue';
import IconPlus from '@icons/IconPlus.vue';
import UserAvatar from '@components/User/UserAvatar.vue';

interface Props {
  postId: string;
  comment: Comment;
  level?: number;
  /** One of the replies a thread too deep to indent shows in a single list:
   * its own replies follow it there, so it renders none */
  flat?: boolean;
  /** The login this comment answers, for the "↳ @login" chip; null for a
   * deleted comment, undefined for no chip */
  answers?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  level: 1,
  flat: false,
  answers: undefined,
});

const thread = inject(commentThreadKey)!;

const userStore = useUserStore();

const notificationsStore = useNotificationsStore();

const authPrompt = useAuthPromptStore();

const comment = ref(props.comment);

const { whenOwnVoteShown } = useOwnVote('comment', comment);

const isRequesting = ref(false);

const isChildrenExpanded = ref(props.level <= COMMENT_AUTO_HIDE_LEVEL);

const visibleDepth = useVisibleDepth();

// `level` counts from 0 at the top
const isThreadFlat = computed(() => props.level + 1 >= visibleDepth.value);

const flatReplies = computed(() =>
  isThreadFlat.value ? flattenReplies(comment.value) : [],
);

const replyCount = computed(() => countReplies(comment.value));

const hasRepliesToggle = computed(
  () => !props.flat && comment.value.children.length > 0,
);

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
      children: [],
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

    thread.addReply(newComment, comment.value._id);
    isChildrenExpanded.value = true;

    replyBody.value = '';
    toggleReply();
  } finally {
    isRequesting.value = false;
  }
};

const editBody = ref('');
const isEditToggled = ref(false);

const canReply = computed(
  () => !comment.value.deleted && !isEditToggled.value && !isReplyToggled.value,
);

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

    const result = await api.comments.deleteComment(_id);

    // The server decides: a comment answered from deeper down, through
    // `replyTo`, has no children here but is still only emptied
    if ('_id' in result) {
      comment.value.deleted = true;

      return;
    }

    thread.remove(_id);
  } finally {
    isRequesting.value = false;
  }
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

/** Waits for the account's own vote first: pressing ▲ on a comment the account
 * has already upvoted would otherwise take that vote back */
async function voteAfterSignIn({ negative }: { negative: boolean }) {
  if (!(await authPrompt.open({ title: 'Sign in to vote' }))) {
    return;
  }

  await whenOwnVoteShown();

  const { rated, author } = comment.value;
  const isOwnComment = author._id === userStore.userId;
  const isVotedSo = rated.isRated && Boolean(rated.negative) === negative;

  if (!userStore.user || isOwnComment || isVotedSo) {
    return;
  }

  await (negative ? downvote : upvote)();
}

const upvote = async () => {
  if (isRequesting.value) {
    return;
  }

  if (!userStore.user) {
    void voteAfterSignIn({ negative: false });

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

  if (!userStore.user) {
    void voteAfterSignIn({ negative: true });

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
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--color-card-edge);
    background: var(--color-surface-secondary);
    margin-block: 1rem;

    /* Runs to the screen's edge on phones, a reply from its indent */
    @media (--phone-only) {
      border-radius: 0;
    }

    /* The reply editor shares the comment's card, and on phones its padding too */
    .u-widget {
      box-shadow: none;

      @media (--phone-only) {
        padding-inline: 0;
      }
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

  /* Wraps rather than overflows: a deep reply on a phone is narrower than a
     long login and its date */
  &__header {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: 4px 0.5rem;
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

  &__avatar .user-avatar {
    width: 1rem;
    height: 1rem;
    margin-left: 0.5rem;
    border-radius: 50%;
  }

  &__votes,
  &__own-actions {
    display: flex;
    align-items: center;
  }

  &__rating {
    min-width: 2ch;
    color: var(--color-text-secondary);
    text-align: center;
    padding-inline: 2px;
  }

  &__reply-to {
    min-width: 0;
    color: var(--color-text-secondary);
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  &__created-at {
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  &__body {
    line-height: 1.5rem;
  }

  &__comment-form {
    margin-top: 16px;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1rem;
    margin-top: 8px;
  }

  &__action {
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-primary-strong);
    font: inherit;
    font-size: 0.9rem;
    font-weight: bold;
    cursor: pointer;
    transition: filter 200ms ease-out;

    @media (--hover) {
      &:hover {
        filter: brightness(120%);
      }
    }
  }

  &__replies {
    margin-left: 3.5px;
    padding-left: 24px;
    border-left: solid 1px var(--color-text-secondary);
  }
}
</style>
