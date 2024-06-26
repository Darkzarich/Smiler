<template>
  <div class="comments__item">
    <div
      v-for="comment in commentData"
      :key="comment.id"
      class="comments__item-main"
      :class="{
        'comments__item-main_first': first,
      }"
      :style="`margin-left: ${indentLevel}rem`"
    >
      <div
        class="comments__item-main-block"
        :class="{
          'comments__item-main-block_created': comment.created,
        }"
      >
        <div class="comments__item-main-block-meta">
          <template v-if="!comment.deleted">
            <div class="comments__item-main-block-meta-rating">
              {{ comment.rating }}
            </div>
            <div
              class="comments__item-main-block-meta-upvote"
              :data-testid="`comment-${comment.id}-upvote`"
              :class="
                comment.rated.isRated && !comment.rated.negative
                  ? 'comments__item-main-block-meta-upvote--active'
                  : ''
              "
              @click="upvote(comment.id)"
            >
              <IconPlus />
            </div>
            <div
              :data-testid="`comment-${comment.id}-downvote`"
              class="comments__item-main-block-meta-downvote"
              :class="
                comment.rated.isRated && comment.rated.negative
                  ? 'comments__item-main-block-meta-downvote--active'
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
              <div class="comments__item-main-block-meta-author">
                {{ comment.author.login }}
              </div>
              <div class="comments__item-main-block-meta-avatar">
                <img
                  :src="$resolveAvatar(comment.author.avatar)"
                  :alt="comment.author.avatar"
                />
              </div>
            </RouterLink>
            <template v-if="$commentCanEdit(comment)">
              <div
                class="comments__item-main-block-meta-edit"
                :data-testid="`comment-${comment.id}-edit`"
                @click="toggleEdit(comment.id)"
              >
                <IconEdit />
              </div>
              <div
                class="comments__item-main-block-meta-delete"
                :data-testid="`comment-${comment.id}-delete`"
                @click="deleteCom(comment.id)"
              >
                <IconDelete />
              </div>
            </template>
          </template>
          <div
            class="comments__item-main-block-meta-date"
            :data-testid="`comment-${comment.id}-date`"
          >
            {{ comment.createdAt | $fromNow }}
          </div>
        </div>
        <div
          class="comments__item-main-block-body"
          :data-testid="`comment-${comment.id}-body`"
        >
          <template v-if="!comment.deleted">
            <template v-if="commentEdit !== comment.id">
              <div v-html="comment.body" />
            </template>

            <template v-else>
              <div class="comments__item-main-answer-editor">
                <BaseTextEditor
                  v-model="commentEditInput"
                  data-testid="comment-edit"
                >
                  <div class="comments__item-main-answer-buttons">
                    <BaseButton
                      class="comments__form-btn"
                      :loading="editSending"
                      data-testid="comment-edit-btn"
                      @click.native="edit(comment.id)"
                    >
                      Send
                    </BaseButton>
                    <BaseButton
                      class="comments__form-btn"
                      data-testid="comment-edit-close-btn"
                      @click.native="toggleEdit"
                    >
                      Close
                    </BaseButton>
                  </div>
                </BaseTextEditor>
              </div>
            </template>

            <div class="comments__item-main-answer">
              <div
                v-if="replyFieldShowFor == comment.id"
                class="comments__item-main-answer-editor"
              >
                <BaseTextEditor v-model="replyBody" data-testid="comment-reply">
                  <div class="comments__item-main-answer-buttons">
                    <BaseButton
                      class="comments__form-btn"
                      :loading="replySending"
                      data-testid="comment-reply-btn"
                      @click.native="reply(comment.id)"
                    >
                      Send
                    </BaseButton>
                    <BaseButton
                      class="comments__form-btn"
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
                  class="comments__item-main-answer-toggler"
                  :data-testid="`comment-${comment.id}-toggle-reply`"
                  @click="toggleReply(comment.id)"
                >
                  Reply
                </div>
                <div
                  v-else
                  class="comments__item-main-answer-toggler comments__item-main-answer-toggler_disabled"
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
        <div
          v-if="!hideChild.includes(comment.id) && comment.children.length > 0"
          :data-testid="`comment-${comment.id}-expander`"
          class="comments__child-toggler"
          @click="toggleShowChild(comment.id)"
        >
          [-]
        </div>
        <div
          v-else-if="comment.children.length > 0"
          :data-testid="`comment-${comment.id}-expander`"
          class="comments__child-toggler comments__child-toggler--active"
          @click="toggleShowChild(comment.id)"
        >
          [+]
        </div>
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
    BaseTextEditor,
    BaseButton,
    IconEdit,
    IconMinus,
    IconPlus,
    IconDelete,
  },
  props: ['data', 'indentLevel', 'post', 'first', 'level'],
  data() {
    return {
      commentData: this.data,
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
        const foundCom = this.commentData.find(
          (el) => el.id === this.commentEdit,
        );
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
        const foundCom = this.commentData.find(
          (el) => el.id === this.commentEdit,
        );
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
          const foundCom = this.commentData.find((el) => el.id === id);

          if (foundCom.children.length > 0) {
            foundCom.deleted = true;
          } else {
            this.commentData.splice(this.commentData.indexOf(foundCom), 1);
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
      const parentCom = this.commentData.find((el) => el.id === parent);

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

        this.commentData[this.commentData.indexOf(parentCom)].children.unshift(
          newComment,
        );
        this.replyBody = '';
        this.replyFieldShowFor = false;
      }
      this.replySending = false;
    },
    async upvote(id) {
      if (!this.loadingRate) {
        const commentItemData = this.commentData.find((el) => el.id === id);

        this.loadingRate = true;

        if (!commentItemData.rated.isRated) {
          commentItemData.rated.isRated = true;
          commentItemData.rated.negative = false;
          commentItemData.rating =
            commentItemData.rating + consts.COMMENT_RATE_VALUE;

          const res = await api.comments.updateRate(id, {
            negative: false,
          });

          if (res.data.error) {
            commentItemData.rated.isRated = false;
            commentItemData.rating =
              commentItemData.rating - consts.COMMENT_RATE_VALUE;
          }
        } else if (commentItemData.rated.negative) {
          commentItemData.rated.isRated = false;
          commentItemData.rating =
            commentItemData.rating + consts.COMMENT_RATE_VALUE;

          const res = await api.comments.removeRate(id);

          if (res.data.error) {
            commentItemData.rated.isRated = true;
            commentItemData.rating =
              commentItemData.rating - consts.COMMENT_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
    async downvote(id) {
      if (!this.loadingRate) {
        const commentItemData = this.commentData.find((el) => el.id === id);

        this.loadingRate = true;

        if (!commentItemData.rated.isRated) {
          commentItemData.rated.isRated = true;
          commentItemData.rated.negative = true;
          commentItemData.rating =
            commentItemData.rating - consts.COMMENT_RATE_VALUE;

          const res = await api.comments.updateRate(id, {
            negative: true,
          });

          if (res.data.error) {
            commentItemData.rated.isRated = false;
            commentItemData.rating =
              commentItemData.rating + consts.COMMENT_RATE_VALUE;
          }
        } else if (!commentItemData.rated.negative) {
          commentItemData.rated.isRated = false;
          commentItemData.rating =
            commentItemData.rating - consts.COMMENT_RATE_VALUE;

          const res = await api.comments.removeRate(id);

          if (res.data.error) {
            commentItemData.rated.isRated = true;
            commentItemData.rating =
              commentItemData.rating + consts.COMMENT_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.comments {
  &__child-toggler {
    display: inline-block;
    position: absolute;
    margin-top: 1rem;
    margin-left: -0.7rem;
    color: var(--color-gray-light);
    font-family: monospace;
    cursor: pointer;

    &:hover,
    &--active {
      color: var(--color-primary);
    }

    &--active {
      font-weight: bold;
    }
  }

  &__form-btn {
    width: 140px;
  }

  &__item {
    &-main {
      border-left: solid 1px var(--color-gray-light);

      &_first {
        margin-left: 0 !important;
        border-left: none !important;

        @include for-size(phone-only) {
          margin-left: -1rem !important;
        }
      }

      &-block {
        margin: 1rem;
        padding: 1rem;
        background: var(--color-widget-bg);
        color: var(--color-main-text);

        @include for-size(phone-only) {
          // margin-left: 0;
          margin-right: 0;
        }

        &_created {
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

        &-meta {
          display: flex;
          flex-direction: row;

          &-avatar {
            img {
              width: 1rem;
              height: 1rem;
              margin-left: 0.5rem;
              border: 1px solid var(--color-gray-light);
              border-radius: 50%;
            }
          }

          a {
            display: flex;
            color: var(--color-main-text);
            text-decoration: none;
          }

          &-date {
            margin-left: 0.5rem;
            color: var(--color-gray-light);
          }

          &-upvote,
          &-rating,
          &-downvote,
          &-edit,
          &-delete {
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

          &-edit,
          &-delete {
            margin-left: 0.5rem;

            svg {
              width: 1.3rem;
              transform: scale(1);
            }
          }

          &-downvote {
            margin-left: -0.5rem;
          }

          &-upvote:hover svg,
          &-upvote--active svg,
          &-edit:hover svg {
            cursor: pointer;
            fill: var(--color-primary);
          }

          &-downvote:hover svg,
          &-downvote--active svg,
          &-delete:hover svg {
            cursor: pointer;
            fill: var(--color-danger);
          }
        }

        &-body {
          line-height: 1.5rem;
        }
      }

      &-answer {
        &-editor {
          margin-top: 1rem;

          .base-text-editor__contenteditable {
            min-height: 6rem;
          }
        }

        &-toggler {
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

          &_disabled {
            color: var(--color-gray-light) !important;
            cursor: default;
          }
        }

        &-buttons {
          @include flex-row;

          gap: 16px;
          margin-top: 20px;

          .button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
