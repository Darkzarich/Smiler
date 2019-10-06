<template>
  <div class="comments__item">
    <div
      v-for="comment in data"
      :key="comment.id"
      class="comments__item-main"
      :style="`margin-left: ${indentLevel}rem`"
    >
      <div class="comments__item-main-block">
        <div class="comments__item-main-block-meta">
          <template v-if="!comment.deleted">
            <div class="comments__item-main-block-meta-rating">
              {{ comment.rating }}
            </div>
            <div
              class="comments__item-main-block-meta-upvote"
              @click="upvote(comment.id)"
              :class="comment.rated.isRated && !comment.rated.negative ? 'comments__item-main-block-meta-upvote_active' : ''"
            >
              <plus-icon/>
            </div>
            <div
              @click="downvote(comment.id)"
              class="comments__item-main-block-meta-downvote"
              :class="comment.rated.isRated && comment.rated.negative ? 'comments__item-main-block-meta-downvote_active' : ''"
            >
              <minus-icon/>
            </div>
            <router-link :to="{
              name: 'UserPage',
              params: {
                login: comment.author.login
              }
            }">
              <div class="comments__item-main-block-meta-author">
                {{ comment.author.login }}
              </div>
              <div class="comments__item-main-block-meta-avatar">
                <img :src="$resolveAvatar(comment.author.avatar)"/>
              </div>
            </router-link>
          </template>
          <div class="comments__item-main-block-meta-date">
            {{ comment.createdAt | $fromNow }}
          </div>
        </div>
        <div class="comments__item-main-block-body">
          <template v-if="!comment.deleted">

            <div v-html="comment.body"/>

            <div class="comments__item-main-answer">
              <div v-if="replyFieldShowFor == comment.id" class="comments__item-main-answer-editor">
                <text-editor-element v-model="replyBody">
                  <div class="comments__item-main-answer-buttons">
                    <button-element
                      :loading="replySending"
                      :callback="reply"
                      :argument="comment.id"
                    >
                      Send
                    </button-element>
                    <button-element
                      :callback="toggleReply"
                    >
                      Close
                    </button-element>
                  </div>
                </text-editor-element>
              </div>
              <template v-else>
                <div
                  class="comments__item-main-answer-toggler"
                  @click="toggleReply(comment.id)"
                >
                  Reply
                </div>
              </template>
            </div>
          </template>
          <template v-else>
            <i>This comment is deleted</i>
          </template>
        </div>
      </div>
      <div v-if="comment.children.length > 0">
        <comment-tree-helper
          :data="comment.children"
          :indent-level="indentLevel"
          :post="post"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import api from '@/api/index';

import CommentTreeHelper from './CommentTreeHelper';
import TextEditorElement from '@/components/BasicElements/TextEditorElement';
import ButtonElement from '@/components/BasicElements/ButtonElement';
import plusIcon from '@/library/svg/plus';
import minusIcon from '@/library/svg/minus';

import consts from '@/const/const';


export default {
  components: {
    CommentTreeHelper,
    TextEditorElement,
    ButtonElement,
    plusIcon,
    minusIcon,
  },
  props: ['data', 'indentLevel', 'post'],
  data() {
    return {
      commentData: this.data,
      loadingRate: false,
      replyFieldShowFor: '',
      replyBody: '',
      replySending: false,
    };
  },
  computed: {
    ...mapState({
      user: state => state.user,
    }),
  },
  methods: {
    toggleReply(comID) {
      if (this.replyFieldShowFor) {
        this.replyFieldShowFor = '';
      } else {
        this.replyFieldShowFor = comID;
      }
    },
    async reply(parent) {
      this.replySending = true;
      const parentCom = this.data.find(el => el.id === parent);

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
        };

        this.data[this.data.indexOf(parentCom)].children.unshift(newComment);
        this.replyBody = '';
        this.replyFieldShowFor = false;
      }
      this.replySending = false;
    },
    async upvote(id) {
      if (!this.loadingRate) {
        const commentItemData = this.commentData.find(el => el.id === id);

        this.loadingRate = true;

        if (!commentItemData.rated.isRated) {
          const res = await api.comments.updateRate(id, {
            negative: false,
          });

          if (!res.data.error) {
            commentItemData.rated.isRated = true;
            commentItemData.rated.negative = false;
            commentItemData.rating += consts.COMMENT_RATE_VALUE;
          }
        } else if (commentItemData.rated.negative) {
          const res = await api.comments.removeRate(id);

          if (!res.data.error) {
            commentItemData.rated.isRated = false;
            commentItemData.rating += consts.COMMENT_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
    async downvote(id) {
      if (!this.loadingRate) {
        const commentItemData = this.commentData.find(el => el.id === id);

        this.loadingRate = true;

        if (!commentItemData.rated.isRated) {
          const res = await api.comments.updateRate(id, {
            negative: true,
          }); push;

          if (!res.data.error) {
            commentItemData.rated.isRated = true;
            commentItemData.rated.negative = true;
            commentItemData.rating -= consts.COMMENT_RATE_VALUE;
          }
        } else if (!commentItemData.rated.negative) {
          const res = await api.comments.removeRate(id);

          if (!res.data.error) {
            commentItemData.rated.isRated = false;
            commentItemData.rating -= consts.COMMENT_RATE_VALUE;
          }
        }
      }

      this.loadingRate = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors.scss';
@import '@/styles/mixins.scss';

.comments {

  &__item {
    &-main {
      border-left: solid 1px $light-gray;
      &-block {
        background: $widget-bg;
        margin: 1rem;
        padding: 1rem;
        color: $main-text;

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

          &-upvote, &-rating, &-downvote {
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

          &-downvote {
            margin-left: -0.5rem;
          }

          &-upvote:hover svg, &-upvote_active svg {
            cursor: pointer;
            fill: $dark-firm;
          }

          &-downvote:hover svg, &-downvote_active svg {
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
            color: darken($firm, 20%);
          }
        }
        &-buttons {
          margin-bottom: -1rem;
          @include flex-row();
          .button {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
