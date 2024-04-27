<template>
  <div class="comments__item">
    <div
      v-for="comment in commentData"
      :key="comment.id"
      class="comments__item-main"
      :class="{
        'comments__item-main_first': first,
        'comments__item-main_refresh-new': comment.isRefreshNew,
      }"
      :style="`margin-left: ${indentLevel}rem`"
      @mouseover="comment.isRefreshNew ? (comment.isRefreshNew = false) : ''"
    >
      <div
        class="comments__item-main-block"
        :class="{
          'comments__item-main-block_created': comment.created,
          'comments__item-main-block_refresh-new': comment.isRefreshNew,
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
                  ? 'comments__item-main-block-meta-upvote_active'
                  : ''
              "
              @click="upvote(comment.id)"
            >
              <PlusIcon />
            </div>
            <div
              :data-testid="`comment-${comment.id}-downvote`"
              class="comments__item-main-block-meta-downvote"
              :class="
                comment.rated.isRated && comment.rated.negative
                  ? 'comments__item-main-block-meta-downvote_active'
                  : ''
              "
              @click="downvote(comment.id)"
            >
              <MinusIcon />
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
                <EditIcon />
              </div>
              <div
                class="comments__item-main-block-meta-delete"
                :data-testid="`comment-${comment.id}-delete`"
                @click="deleteCom(comment.id)"
              >
                <DeleteIcon />
              </div>
            </template>
          </template>
          <div class="comments__item-main-block-meta-date">
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
                <TextEditorElement
                  v-model="commentEditInput"
                  data-testid="comment-edit"
                >
                  <div class="comments__item-main-answer-buttons">
                    <ButtonElement
                      :loading="editSending"
                      :callback="edit"
                      :argument="comment.id"
                      data-testid="comment-edit-btn"
                    >
                      Send
                    </ButtonElement>
                    <ButtonElement
                      :callback="toggleEdit"
                      data-testid="comment-edit-close-btn"
                    >
                      Close
                    </ButtonElement>
                  </div>
                </TextEditorElement>
              </div>
            </template>

            <div class="comments__item-main-answer">
              <div
                v-if="replyFieldShowFor == comment.id"
                class="comments__item-main-answer-editor"
              >
                <TextEditorElement
                  v-model="replyBody"
                  data-testid="comment-reply"
                >
                  <div class="comments__item-main-answer-buttons">
                    <ButtonElement
                      :loading="replySending"
                      :callback="reply"
                      :argument="comment.id"
                      data-testid="comment-reply-btn"
                    >
                      Send
                    </ButtonElement>
                    <ButtonElement
                      :callback="toggleReply"
                      data-testid="comment-reply-close-btn"
                    >
                      Close
                    </ButtonElement>
                  </div>
                </TextEditorElement>
              </div>
              <template v-else>
                <div
                  v-if="level < COMMENTS_NESTED_LIMIT && user.authState"
                  class="comments__item-main-answer-toggler"
                  :data-testid="`comment-${comment.id}-toggle-reply`"
                  @click="toggleReply(comment.id)"
                >
                  Reply
                </div>
                <div
                  v-else-if="level < COMMENTS_NESTED_LIMIT"
                  class="comments__item-main-answer-toggler comments__item-main-answer-toggler_disabled"
                  title="Please, Log in to be able to answer"
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
          class="comments__child-toggler comments__child-toggler_active"
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
import { mapState } from 'vuex';
import CommentTreeHelper from './CommentTreeHelper.vue';
import api from '@/api/index';
import ButtonElement from '@/components/BasicElements/ButtonElement.vue';
import TextEditorElement from '@/components/BasicElements/TextEditorElement.vue';
import consts from '@/const/const';
import DeleteIcon from '@/library/svg/DeleteIcon.vue';
import EditIcon from '@/library/svg/EditIcon.vue';
import MinusIcon from '@/library/svg/MinusIcon.vue';
import PlusIcon from '@/library/svg/PlusIcon.vue';

export default {
  components: {
    CommentTreeHelper,
    TextEditorElement,
    ButtonElement,
    EditIcon,
    MinusIcon,
    PlusIcon,
    DeleteIcon,
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
@use 'sass:color';
@import '@/styles/colors';
@import '@/styles/mixins';

.comments {
  &__child-toggler {
    display: inline-block;
    position: absolute;
    margin-top: 1rem;
    color: $light-gray;
    cursor: pointer;

    &:hover,
    &_active {
      color: $firm;
    }

    &_active {
      font-weight: bold;
    }

    font-family: monospace;
    margin-left: -0.7rem;
  }

  &__item {
    &-main {
      border-left: solid 1px $light-gray;

      &_first {
        border-left: none !important;
        margin-left: 0 !important;

        @include for-size(phone-only) {
          margin-left: -1rem !important;
        }
      }

      &_refresh-new {
        border-left: solid 3px $firm !important;
      }

      &-block {
        background: $widget-bg;
        margin: 1rem;
        padding: 1rem;

        @include for-size(phone-only) {
          // margin-left: 0;
          margin-right: 0;
        }

        color: $main-text;

        &_refresh-new {
          background: #86c2321c;
        }

        &_created {
          animation: flash 1s ease-out;

          @keyframes flash {
            0% {
              background: $comments-animation;
            }

            100% {
              background: $widget-bg;
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
              border-radius: 50%;
            }
          }

          a {
            display: flex;
            color: $main-text;
            text-decoration: none;
          }

          &-date {
            margin-left: 0.5rem;
            color: $light-gray;
          }

          &-upvote,
          &-rating,
          &-downvote,
          &-edit,
          &-delete {
            color: $light-gray;

            svg {
              fill: $light-gray;
              width: 2rem;
              height: 2rem;
              position: relative;
              top: -8px;
              transform: scale(1.2);
            }
          }

          &-edit,
          &-delete {
            margin-left: 0.5rem;

            svg {
              transform: scale(1);
              width: 1.3rem;
            }
          }

          &-downvote {
            margin-left: -0.5rem;
          }

          &-upvote:hover svg,
          &-upvote_active svg,
          &-edit:hover svg {
            cursor: pointer;
            fill: $dark-firm;
          }

          &-downvote:hover svg,
          &-downvote_active svg,
          &-delete:hover svg {
            cursor: pointer;
            fill: $dark-red;
          }
        }

        &-body {
          line-height: 1.5rem;
        }
      }

      &-answer {
        &-editor {
          width: 85%;

          @include for-size(phone-only) {
            width: 100%;
          }

          .text-editor {
            height: 6rem;
          }
        }

        &-toggler {
          color: $firm;
          margin-top: 0.5rem;
          display: inline-block;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: bold;
          transition: color 0.2s ease;

          &:hover {
            color: color.adjust($firm, $lightness: -20%);
          }

          &_disabled {
            color: $light-gray !important;
            cursor: default;
          }
        }

        &-buttons {
          margin-bottom: -1rem;

          @include flex-row;

          .button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
