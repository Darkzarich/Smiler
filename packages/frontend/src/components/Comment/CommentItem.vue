<template>
  <div class="comment-item">
    <div
      class="comment-item__content"
      :class="{
        'comment-item__content--created': Boolean(commentData.created),
      }"
    >
      <div class="comment-item__header">
        <template v-if="!commentData.deleted">
          <div
            class="comment-item__rating"
            :data-testid="`comment-${commentData.id}-rating`"
          >
            {{ commentData.rating }}
          </div>

          <div
            class="comment-item__upvote-btn"
            :data-testid="`comment-${commentData.id}-upvote`"
            :class="
              commentData.rated.isRated && !commentData.rated.negative
                ? 'comment-item__upvote-btn--active'
                : ''
            "
            @click="upvote()"
          >
            <IconPlus />
          </div>

          <div
            :data-testid="`comment-${commentData.id}-downvote`"
            class="comment-item__downvote-btn"
            :class="
              commentData.rated.isRated && commentData.rated.negative
                ? 'comment-item__downvote-btn--active'
                : ''
            "
            @click="downvote()"
          >
            <IconMinus />
          </div>

          <RouterLink
            :to="{
              name: 'UserPage',
              params: {
                login: commentData.author.login,
              },
            }"
          >
            <div class="comment-item__author">
              {{ commentData.author.login }}
            </div>

            <div class="comment-item__avatar">
              <img
                :src="$resolveAvatar(commentData.author.avatar)"
                :alt="commentData.author.avatar"
              />
            </div>
          </RouterLink>

          <template v-if="$commentCanEdit(comment)">
            <div
              class="comment-item__edit-btn"
              :data-testid="`comment-${commentData.id}-edit`"
              @click="toggleEdit()"
            >
              <IconEdit />
            </div>

            <div
              class="comment-item__delete-btn"
              :data-testid="`comment-${commentData.id}-delete`"
              @click="handleDeleteComment()"
            >
              <IconDelete />
            </div>
          </template>
        </template>

        <div
          class="comment-item__created-at"
          :data-testid="`comment-${commentData.id}-date`"
        >
          {{ commentData.createdAt | $fromNow }}
        </div>
      </div>

      <div
        class="comment-item__body"
        :data-testid="`comment-${commentData.id}-body`"
      >
        <template v-if="commentData.deleted">
          <i>This comment has been deleted</i>
        </template>

        <!-- TODO: Make only one CommentForm form -->
        <CommentForm
          v-else-if="isEditComment"
          v-model="editBody"
          class="comment-item__comment-form"
          :loading="isRequesting"
          data-testid="comment-edit"
          @submit="edit(commentData.id)"
          @close="toggleEdit"
        />

        <template v-else>
          <div v-html="commentData.body" />

          <div class="comment-item__reply">
            <CommentForm
              v-if="isReplyComment"
              v-model="replyBody"
              class="comment-item__comment-form"
              :loading="isRequesting"
              data-testid="comment-reply"
              @submit="reply()"
              @close="toggleReply"
            />

            <template v-else-if="level < COMMENTS_NESTED_LIMIT">
              <div
                :class="{
                  'comment-item__reply-toggler--disabled': !isUserAuth,
                }"
                class="comment-item__reply-toggler"
                :data-testid="`comment-${commentData.id}-toggle-reply`"
                @click="toggleReply()"
              >
                Reply
              </div>
            </template>
          </div>
        </template>
      </div>

      <CommentChildExpander
        v-if="commentData.children.length > 0"
        :data-testid="`comment-${commentData.id}-expander`"
        :is-expanded="isChildrenExpanded"
        @click="isChildrenExpanded = !isChildrenExpanded"
      />
    </div>

    <CommentTreeHelper
      v-if="isChildrenExpanded"
      :data="commentData.children"
      :post-id="postId"
      :level="level + 1"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import CommentChildExpander from './CommentChildExpander.vue';
import CommentForm from './CommentForm.vue';
import CommentTreeHelper from './CommentTreeHelper.vue';
import api from '@/api';
import consts from '@/const/const';
import IconDelete from '@icons/IconDelete.vue';
import IconEdit from '@icons/IconEdit.vue';
import IconMinus from '@icons/IconMinus.vue';
import IconPlus from '@icons/IconPlus.vue';

export default {
  components: {
    CommentTreeHelper,
    CommentChildExpander,
    IconEdit,
    IconMinus,
    IconPlus,
    IconDelete,
    CommentForm,
  },
  props: {
    postId: {
      type: String,
      default: '',
    },
    comment: {
      type: Object,
      default: () => {},
    },
    level: {
      type: Number,
      default: 1,
    },
  },
  emits: ['remove'],
  data() {
    return {
      commentData: { ...this.comment },
      isRequesting: false,
      isChildrenExpanded: this.level <= consts.COMMENT_AUTO_HIDE_LEVEL,
      COMMENTS_NESTED_LIMIT: consts.COMMENTS_NESTED_LIMIT,
      replyBody: '',
      isReplyComment: false,
      editBody: '',
      isEditComment: false,
    };
  },
  computed: {
    ...mapGetters(['isUserAuth']),
    ...mapState({
      user: (state) => state.user,
    }),
  },
  methods: {
    toggleReply() {
      if (!this.isUserAuth) {
        this.$store.dispatch('showErrorNotification', {
          message: 'Please sign in or create an account to leave a reply.',
        });

        return;
      }

      this.isReplyComment = !this.isReplyComment;
    },
    toggleEdit() {
      this.editBody = this.commentData.body;
      this.isEditComment = !this.isEditComment;
    },
    async edit() {
      this.isRequesting = true;

      const res = await api.comments.updateComment(this.commentData.id, {
        body: this.editBody,
      });

      if (!res.data.error) {
        this.commentData = {
          ...this.commentData,
          ...res.data,
        };
        this.toggleEdit();
      }

      this.isRequesting = false;
    },
    // TODO: Changing post comment count on delete
    async handleDeleteComment() {
      if (this.isRequesting) {
        return;
      }

      this.isRequesting = true;

      const { id } = this.commentData;

      const res = await api.comments.deleteComment(id);

      this.isRequesting = false;

      if (res.data.error) {
        return;
      }

      if (
        !this.commentData.children ||
        this.commentData.children.length === 0
      ) {
        this.$emit('remove');

        return;
      }

      this.commentData.deleted = true;
    },
    async upvote() {
      if (this.isRequesting) {
        return;
      }

      this.isRequesting = true;

      if (!this.commentData.rated.isRated) {
        // Optimistic update
        this.commentData.rated.isRated = true;
        this.commentData.rated.negative = false;
        this.commentData.rating =
          this.commentData.rating + consts.COMMENT_RATE_VALUE;

        const res = await api.comments.updateRate(this.commentData.id, {
          negative: false,
        });

        this.isRequesting = false;

        if (res.data.error) {
          this.commentData.rated.isRated = false;
          this.commentData.rating =
            this.commentData.rating - consts.COMMENT_RATE_VALUE;

          return;
        }

        this.commentData = {
          ...this.commentData,
          rating: res.data.rating,
          deleted: res.data.deleted,
        };
      } else if (this.commentData.rated.negative) {
        // Optimistic update
        this.commentData.rated.isRated = false;
        this.commentData.rating =
          this.commentData.rating + consts.COMMENT_RATE_VALUE;

        const res = await api.comments.removeRate(this.commentData.id);

        this.isRequesting = false;

        if (res.data.error) {
          this.commentData.rated.isRated = true;
          this.commentData.rating =
            this.commentData.rating - consts.COMMENT_RATE_VALUE;

          return;
        }

        this.commentData = {
          ...this.commentData,
          rating: res.data.rating,
          deleted: res.data.deleted,
        };
      }
    },
    async downvote() {
      if (this.isRequesting) {
        return;
      }

      this.isRequesting = true;

      if (!this.commentData.rated.isRated) {
        this.commentData.rated.isRated = true;
        this.commentData.rated.negative = true;
        this.commentData.rating =
          this.commentData.rating - consts.COMMENT_RATE_VALUE;

        const res = await api.comments.updateRate(this.commentData.id, {
          negative: true,
        });

        this.isRequesting = false;

        if (res.data.error) {
          this.commentData.rated.isRated = false;
          this.commentData.rating =
            this.commentData.rating + consts.COMMENT_RATE_VALUE;

          return;
        }

        this.commentData = {
          ...this.commentData,
          rating: res.data.rating,
          deleted: res.data.deleted,
        };
      } else if (!this.commentData.rated.negative) {
        this.commentData.rated.isRated = false;
        this.commentData.rating =
          this.commentData.rating - consts.COMMENT_RATE_VALUE;

        const res = await api.comments.removeRate(this.commentData.id);

        this.isRequesting = false;

        if (res.data.error) {
          this.commentData.rated.isRated = true;
          this.commentData.rating =
            this.commentData.rating + consts.COMMENT_RATE_VALUE;

          return;
        }

        this.commentData = {
          ...this.commentData,
          rating: res.data.rating,
          deleted: res.data.deleted,
        };
      }

      this.isRequesting = false;
    },
    async reply() {
      if (!this.replyBody) {
        this.$store.dispatch('showErrorNotification', {
          message: 'Comment cannot be empty. Enter some text first!',
        });

        return;
      }

      this.isRequesting = true;

      const res = await api.comments.createComment({
        post: this.postId,
        parent: this.commentData.id,
        body: this.replyBody,
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

        this.commentData.children.unshift(newComment);

        this.replyBody = '';
        this.toggleReply();
      }

      this.isRequesting = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.comment-item {
  &__content {
    margin: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: var(--color-widget-bg);

    @include for-size(phone-only) {
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
}
</style>
