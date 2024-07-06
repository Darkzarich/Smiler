<template>
  <div class="comment-list">
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="comment-list__comment"
      :class="{
        'comment-list__comment--first': isFirst,
        'comment-list__comment--created': Boolean(comment.created),
      }"
      :style="`margin-left: ${indentLevel}rem`"
    >
      <div
        class="comment-list__comment-content"
        :class="{
          'comment-list__comment-content--created': Boolean(comment.created),
        }"
      >
        <div class="comment-list__comment-header">
          <template v-if="!comment.deleted">
            <div class="comment-list__comment-rating">
              {{ comment.rating }}
            </div>

            <div
              class="comment-list__comment-upvote-btn"
              :data-testid="`comment-${comment.id}-upvote`"
              :class="
                comment.rated.isRated && !comment.rated.negative
                  ? 'comment-list__comment-upvote-btn--active'
                  : ''
              "
              @click="upvote(comment.id)"
            >
              <IconPlus />
            </div>

            <div
              :data-testid="`comment-${comment.id}-downvote`"
              class="comment-list__comment-downvote-btn"
              :class="
                comment.rated.isRated && comment.rated.negative
                  ? 'comment-list__comment-downvote-btn--active'
                  : ''
              "
              @click="downvote(comment.id)"
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
              <div class="comment-list__comment-author">
                {{ comment.author.login }}
              </div>

              <div class="comment-list__comment-avatar">
                <img
                  :src="$resolveAvatar(comment.author.avatar)"
                  :alt="comment.author.avatar"
                />
              </div>
            </RouterLink>

            <template v-if="$commentCanEdit(comment)">
              <div
                class="comment-list__comment-edit-btn"
                :data-testid="`comment-${comment.id}-edit`"
                @click="toggleEdit(comment.id)"
              >
                <IconEdit />
              </div>

              <div
                class="comment-list__comment-delete-btn"
                :data-testid="`comment-${comment.id}-delete`"
                @click="deleteCom(comment.id)"
              >
                <IconDelete />
              </div>
            </template>
          </template>

          <div
            class="comment-list__comment-date"
            :data-testid="`comment-${comment.id}-date`"
          >
            {{ comment.createdAt | $fromNow }}
          </div>
        </div>

        <div
          class="comment-list__comment-body"
          :data-testid="`comment-${comment.id}-body`"
        >
          <template v-if="!comment.deleted">
            <template v-if="commentEdit !== comment.id">
              <div v-html="comment.body" />
            </template>

            <template v-else>
              <div class="comment-list__comment-answer-editor">
                <BaseTextEditor
                  v-model="commentEditInput"
                  data-testid="comment-edit"
                >
                  <div class="comment-list__comment-answer-actions">
                    <BaseButton
                      class="comment-list__comment-answer-form-btn"
                      :loading="editSending"
                      data-testid="comment-edit-btn"
                      @click.native="edit(comment.id)"
                    >
                      Send
                    </BaseButton>

                    <BaseButton
                      class="comment-list__comment-answer-form-btn"
                      data-testid="comment-edit-close-btn"
                      @click.native="toggleEdit"
                    >
                      Close
                    </BaseButton>
                  </div>
                </BaseTextEditor>
              </div>
            </template>

            <div class="comment-list__comment-answer">
              <div
                v-if="replyFieldShowFor == comment.id"
                class="comment-list__comment-answer-editor"
              >
                <BaseTextEditor v-model="replyBody" data-testid="comment-reply">
                  <div class="comment-list__comment-answer-actions">
                    <BaseButton
                      class="comment-list__comment-answer-form-btn"
                      :loading="replySending"
                      data-testid="comment-reply-btn"
                      @click.native="reply(comment.id)"
                    >
                      Send
                    </BaseButton>

                    <BaseButton
                      class="comment-list__comment-answer-form-btn"
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
                  class="comment-list__comment-answer-toggler"
                  :data-testid="`comment-${comment.id}-toggle-reply`"
                  @click="toggleReply(comment.id)"
                >
                  Reply
                </div>

                <div
                  v-else
                  class="comment-list__comment-answer-toggler comment-list__comment-answer-toggler--disabled"
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
          :is-expanded="
            !hideChild.includes(comment.id) && comment.children.length > 0
          "
          @click.native="toggleShowChild(comment.id)"
        />
      </div>

      <div
        v-if="comment.children.length > 0 && !hideChild.includes(comment.id)"
      >
        <CommentTreeHelper
          :data="comment.children"
          :indent-level="indentLevel"
          :post="post"
          :level="level"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
import CommentChildExpander from './CommentChildExpander.vue';
import CommentTreeHelper from './CommentTreeHelper.vue';
import api from '@/api/index';
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
  props: ['data', 'indentLevel', 'post', 'isFirst', 'level'],
  data() {
    return {
      comments: this.data,
      commentEdit: '',
      commentEditInput: '',
      loadingRate: false,
      replyFieldShowFor: '',
      replyBody: '',
      replySending: false,
      editSending: false,
      deleteSending: false,
      hideChild:
        this.level === consts.COMMENT_AUTO_HIDE_LEVEL
          ? this.data.map((el) => el.id)
          : [],
      COMMENTS_NESTED_LIMIT: consts.COMMENTS_NESTED_LIMIT,
    };
  },
  computed: {
    ...mapGetters(['isUserAuth']),
    ...mapState({
      user: (state) => state.user,
    }),
  },
  methods: {
    toggleShowChild(id) {
      if (this.hideChild.includes(id)) {
        this.hideChild.splice(this.hideChild.indexOf(id), 1);
      } else {
        this.hideChild.push(id);
      }
    },
    toggleReply(comID) {
      if (this.replyFieldShowFor) {
        this.replyFieldShowFor = '';
      } else {
        this.replyFieldShowFor = comID;
      }
    },
    toggleEdit(id) {
      if (id) {
        this.commentEdit = id;
        const foundCom = this.comments.find((el) => el.id === this.commentEdit);
        this.commentEditInput = foundCom.body;
      } else {
        this.commentEdit = '';
      }
    },
    async edit() {
      this.editSending = true;

      const res = await api.comments.updateComment(this.commentEdit, {
        body: this.commentEditInput,
      });

      if (!res.data.error) {
        const foundCom = this.comments.find((el) => el.id === this.commentEdit);
        foundCom.body = this.commentEditInput;
        this.toggleEdit();
      }

      this.editSending = false;
    },
    // TODO: events for changing post comment count on delete
    async deleteCom(id) {
      if (!this.deleteSending) {
        this.deleteSending = true;

        const res = await api.comments.deleteComment(id);

        if (!res.data.error) {
          const foundCom = this.comments.find((el) => el.id === id);

          if (foundCom.children.length > 0) {
            foundCom.deleted = true;
          } else {
            this.comments.splice(this.comments.indexOf(foundCom), 1);
          }
        }
        this.deleteSending = false;
      }
    },
    async reply(parent) {
      if (!this.replyBody) {
        this.$store.dispatch('showErrorNotification', {
          message: 'Comment cannot be empty. Enter some text first!',
        });

        return;
      }

      this.replySending = true;
      const parentCom = this.comments.find((el) => el.id === parent);

      const res = await api.comments.createComment({
        post: this.post,
        parent,
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

        this.comments[this.comments.indexOf(parentCom)].children.unshift(
          newComment,
        );
        this.replyBody = '';
        this.replyFieldShowFor = false;
      }
      this.replySending = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.comment-list {
  &__comment {
    border-left: solid 1px var(--color-gray-light);
    color: var(--color-main-text);

    &--first {
      margin-left: 0 !important;
      border-left: none !important;

      @include for-size(phone-only) {
        margin-left: -1rem !important;
      }
    }
  }

  &__comment-content {
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

  &__comment-header {
    display: flex;
    flex-direction: row;

    a {
      display: flex;
      color: var(--color-main-text);
      text-decoration: none;
    }
  }

  &__comment-avatar img {
    width: 1rem;
    height: 1rem;
    margin-left: 0.5rem;
    border: 1px solid var(--color-gray-light);
    border-radius: 50%;
  }

  &__comment-upvote-btn,
  &__comment-rating,
  &__comment-downvote-btn,
  &__comment-edit-btn,
  &__comment-delete-btn {
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

  &__comment-downvote-btn {
    margin-left: -0.5rem;
  }

  &__comment-edit-btn,
  &__comment-delete-btn {
    margin-left: 0.5rem;

    svg {
      width: 1.3rem;
      transform: scale(1);
    }
  }

  &__comment-upvote-btn--active,
  &__comment-upvote-btn:hover,
  &__comment-edit:hover {
    svg {
      cursor: pointer;
      fill: var(--color-primary);
    }
  }

  &__comment-downvote-btn:hover,
  &__comment-downvote-btn--active,
  &__comment-delete:hover {
    /* stylelint-disable-next-line no-descending-specificity */
    svg {
      cursor: pointer;
      fill: var(--color-danger);
    }
  }

  &__comment-date {
    margin-left: 0.5rem;
    color: var(--color-gray-light);
  }

  &__comment-body {
    line-height: 1.5rem;
  }

  &__comment-answer-editor {
    margin-top: 1rem;

    .base-text-editor__contenteditable {
      min-height: 6rem;
    }
  }

  &__comment-answer-toggler {
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

  &__comment-answer-actions {
    @include flex-row;

    gap: 16px;
    margin-top: 20px;
  }

  &__comment-answer-form-btn {
    width: 140px;
  }
}
</style>
