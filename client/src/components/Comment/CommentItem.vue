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
          <div class="comment-item__rating">
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
            @click="upvote()"
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
            @click="downvote()"
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
                :src="$resolveAvatar(comment.author.avatar)"
                :alt="comment.author.avatar"
              />
            </div>
          </RouterLink>

          <template v-if="$commentCanEdit(comment)">
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
          class="comment-item__date"
          :data-testid="`comment-${comment.id}-date`"
        >
          {{ comment.createdAt | $fromNow }}
        </div>
      </div>

      <div
        class="comment-item__body"
        :data-testid="`comment-${comment.id}-body`"
      >
        <template v-if="!comment.deleted">
          <template v-if="!isEditComment">
            <div v-html="comment.body" />
          </template>

          <template v-else>
            <div class="comment-item__answer-editor">
              <BaseTextEditor
                v-model="commentEditInput"
                data-testid="comment-edit"
              >
                <div class="comment-item__answer-actions">
                  <BaseButton
                    class="comment-item__answer-form-btn"
                    :loading="isRequesting"
                    data-testid="comment-edit-btn"
                    @click.native="edit(comment.id)"
                  >
                    Send
                  </BaseButton>

                  <BaseButton
                    class="comment-item__answer-form-btn"
                    data-testid="comment-edit-close-btn"
                    @click.native="toggleEdit"
                  >
                    Close
                  </BaseButton>
                </div>
              </BaseTextEditor>
            </div>
          </template>

          <div class="comment-item__answer">
            <div v-if="isReplyComment" class="comment-item__answer-editor">
              <BaseTextEditor v-model="replyBody" data-testid="comment-reply">
                <div class="comment-item__answer-actions">
                  <BaseButton
                    class="comment-item__answer-form-btn"
                    :loading="isRequesting"
                    data-testid="comment-reply-btn"
                    @click.native="reply()"
                  >
                    Send
                  </BaseButton>

                  <BaseButton
                    class="comment-item__answer-form-btn"
                    data-testid="comment-reply-close-btn"
                    @click.native="toggleReply"
                  >
                    Close
                  </BaseButton>
                </div>
              </BaseTextEditor>
            </div>

            <template v-else-if="level < COMMENTS_NESTED_LIMIT">
              <div
                v-if="isUserAuth"
                class="comment-item__answer-toggler"
                :data-testid="`comment-${comment.id}-toggle-reply`"
                @click="toggleReply()"
              >
                Reply
              </div>

              <div
                v-else
                class="comment-item__answer-toggler comment-item__answer-toggler--disabled"
                title="Sign up to be able to leave a reply"
              >
                Reply
              </div>
            </template>
          </div>
        </template>

        <template v-else>
          <i>This comment has been deleted</i>
        </template>
      </div>

      <CommentChildExpander
        v-if="comment.children.length > 0"
        :data-testid="`comment-${comment.id}-expander`"
        :is-expanded="isChildrenExpanded"
        :children-count="comment.children.length"
        @click.native="isChildrenExpanded = !isChildrenExpanded"
      />
    </div>

    <CommentTreeHelper
      v-if="isChildrenExpanded"
      :data="comment.children"
      :post-id="postId"
      :level="level + 1"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import CommentChildExpander from './CommentChildExpander.vue';
import CommentTreeHelper from './CommentTreeHelper.vue';
import api from '@/api';
import consts from '@/const/const';
import BaseButton from '@common/BaseButton.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';
import IconDelete from '@icons/IconDelete.vue';
import IconEdit from '@icons/IconEdit.vue';
import IconMinus from '@icons/IconMinus.vue';
import IconPlus from '@icons/IconPlus.vue';

export default {
  components: {
    CommentTreeHelper,
    CommentChildExpander,
    BaseTextEditor,
    BaseButton,
    IconEdit,
    IconMinus,
    IconPlus,
    IconDelete,
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
  data() {
    return {
      COMMENTS_NESTED_LIMIT: consts.COMMENTS_NESTED_LIMIT,
      isChildrenExpanded: this.level <= consts.COMMENT_AUTO_HIDE_LEVEL,
      isRequesting: false,
      commentData: this.comment,
      replyBody: '',
      replyFieldShowFor: '',
      isEditComment: false,
      isReplyComment: false,
      commentEditInput: '',
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
      this.isReplyComment = !this.isReplyComment;
    },
    toggleEdit() {
      this.isEditComment = !this.isEditComment;
      this.commentEditInput = this.comment.body;
    },
    async edit() {
      this.isRequesting = true;

      const res = await api.comments.updateComment(this.commentEdit, {
        body: this.commentEditInput,
      });

      if (!res.data.error) {
        const foundCom = this.comments.find((el) => el.id === this.commentEdit);
        foundCom.body = this.commentEditInput;
        this.toggleEdit();
      }

      this.isRequesting = false;
    },
    // TODO: events for changing post comment count on delete
    async handleDeleteComment() {
      if (this.isRequesting) {
        return;
      }

      this.isRequesting = true;

      const res = await api.comments.deleteComment(this.comment.id);

      if (!res.data.error) {
        this.$emit('remove');
      }

      this.isRequesting = false;
    },
    async upvote() {
      if (this.isRequesting) {
        return;
      }

      this.isRequesting = true;

      if (!this.comment.rated.isRated) {
        this.comment.rated.isRated = true;
        this.comment.rated.negative = false;
        this.comment.rating = this.comment.rating + consts.COMMENT_RATE_VALUE;

        const res = await api.comments.updateRate(this.comment.id, {
          negative: false,
        });

        if (res.data.error) {
          this.comment.rated.isRated = false;
          this.comment.rating = this.comment.rating - consts.COMMENT_RATE_VALUE;
        }
      } else if (this.comment.rated.negative) {
        this.comment.rated.isRated = false;
        this.comment.rating = this.comment.rating + consts.COMMENT_RATE_VALUE;

        const res = await api.comments.removeRate(this.comment.id);

        if (res.data.error) {
          this.comment.rated.isRated = true;
          this.comment.rating = this.comment.rating - consts.COMMENT_RATE_VALUE;
        }
      }

      this.isRequesting = false;
    },
    async downvote() {
      if (this.isRequesting) {
        return;
      }

      this.isRequesting = true;

      if (!this.comment.rated.isRated) {
        this.comment.rated.isRated = true;
        this.comment.rated.negative = true;
        this.comment.rating = this.comment.rating - consts.COMMENT_RATE_VALUE;

        const res = await api.comments.updateRate(this.comment.id, {
          negative: true,
        });

        if (res.data.error) {
          this.comment.rated.isRated = false;
          this.comment.rating = this.comment.rating + consts.COMMENT_RATE_VALUE;
        }
      } else if (!this.comment.rated.negative) {
        this.comment.rated.isRated = false;
        this.comment.rating = this.comment.rating - consts.COMMENT_RATE_VALUE;

        const res = await api.comments.removeRate(this.comment.id);

        if (res.data.error) {
          this.comment.rated.isRated = true;
          this.comment.rating = this.comment.rating + consts.COMMENT_RATE_VALUE;
        }
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

      const { id } = this.comment;

      const res = await api.comments.createComment({
        post: this.postId,
        parent: id,
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

        this.comment.children.unshift(newComment);

        this.replyBody = '';
        this.replyFieldShowFor = false;
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
    border: 1px solid var(--color-gray-light);
    border-radius: 50%;
  }

  &__upvote-btn,
  &__rating,
  &__downvote-btn,
  &__edit-btn,
  &__delete-btn {
    color: var(--color-gray-light);

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
      cursor: pointer;
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

  &__date {
    margin-left: 0.5rem;
    color: var(--color-gray-light);
  }

  &__body {
    line-height: 1.5rem;
  }

  &__answer-editor {
    margin-top: 1rem;

    .base-text-editor__contenteditable {
      min-height: 6rem;
    }
  }

  &__answer-toggler {
    display: inline-block;
    margin-top: 0.5rem;
    color: var(--color-primary);
    font-size: 0.9rem;
    cursor: pointer;
    font-weight: bold;
    transition: color 0.2s ease;

    &:hover {
      filter: brightness(120%);
    }

    &--disabled {
      color: var(--color-gray-light) !important;
      cursor: default;
    }
  }

  &__answer-actions {
    @include flex-row;

    gap: 16px;
    margin-top: 20px;
  }

  &__answer-form-btn {
    width: 140px;
  }
}
</style>
