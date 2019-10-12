<template>
  <div>
    <div class="post-container">
      <post v-if="showPost" :post="post" :can-edit="$postCanEdit(post)"/>
    </div>

    <div class="comments" id="comments">
      <div
        @click="refreshComments()"
        title="Refresh comments"
        :class="commentsRefreshing ? 'comments__update_refreshing' : ''"
        class="comments__update">
        <refresh-icon/>
        <template v-if="newCommentsCount > 0"> <span>+{{ newCommentsCount }}</span> </template>
      </div>
      <div class="comments__title">
        Commentaries ( <span class="comments__title-number"> {{post.commentCount }} </span> )
      </div>
      <div class="comments__form" :class="!user.authState ? 'comments__form_disabled' : ''" v-if="!commentsLoading">
        <template v-if="user.authState">
          <div class="comments__form-title">
            Leave the commentary
          </div>
          <text-editor-element
            v-model="sendCommentBody"
          >
                    <div class="comments__form-submit">
            <button-element
              :loading="sendCommentLoading"
              :callback="sendComment"
            >
              Send
            </button-element>
          </div>
          </text-editor-element>
        </template>
        <template v-else>
          Please, <b>login</b> \ <b>register</b> to be able to leave any comments
        </template>
      </div>
      <comments
        v-if="!commentsLoading && comments.length > 0"
        :data="comments"
        :indent-level="1"
        :post="post.id"
        :level="0"
        :first="true"
      />
      <div class="comments__no-comments" v-else-if="!commentsLoading">
        No comments yet... Be the first!
      </div>
      <div class="comments__loading" v-else>
        <loading-icon/>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Post from '@/components/Post/Post.vue';
import Comments from '@/components/Comment/Comments.vue';

import TextEditorElement from '@/components/BasicElements/TextEditorElement';
import ButtonElement from '@/components/BasicElements/ButtonElement';

import loadingIcon from '@/library/svg/animation/circularLoader';
import refreshIcon from '@/library/svg/refresh';

import api from '@/api';

import consts from '@/const/const';

export default {
  data() {
    return {
      post: {},
      showPost: false,
      comments: [],
      commentsLoading: false,
      sendCommentBody: '',
      sendCommentLoading: false,
      commentsRefreshing: false,
      newCommentsCount: 0,
    };
  },
  components: {
    Post,
    TextEditorElement,
    ButtonElement,
    Comments,
    loadingIcon,
    refreshIcon,
  },
  computed: {
    ...mapState({
      user: state => state.user,
    }),
  },
  async beforeRouteEnter(to, from, next) {
    const post = await api.posts.getPostBySlug(to.params.slug);

    if (post.data.error) {
      next({
        name: '404',
      });
    } else {
      next(vm => vm.setPost(post.data));
    }
  },
  methods: {
    async setPost(post) {
      this.post = post;
      this.showPost = true;
      // comments

      this.commentsLoading = true;

      const res = await api.comments.getComments({
        limit: consts.COMMENTS_INITIAL_COUNT,
        post: post.id,
      });

      this.comments = res.data;
      this.commentsLoading = false;
    },
    async refreshComments() {
      this.commentsRefreshing = true;

      const res = await api.comments.getComments({
        limit: consts.COMMENTS_INITIAL_COUNT,
        post: this.post.id,
      });

      if (!res.data.error) {
        res.data[0].children[1].children.push({
          author: {
            avatar: 'https://nyaa.shikimori.one/system/users/x160/91575.png?1469271045',
            id: '123',
            login: 'DZ',
          },
          body: 'ITS WORKING',
          children: [],
          createdAt: '2019-10-08T13:50:40.089Z',
          id: '5d9c94301c11d80030f48b282',
          rated: { isRated: false, negative: false },
          isRated: false,
          negative: false,
          rating: 0,
        });
        this.recursiveCommentsCheck(null, res.data);
        this.commentsRefreshing = false;
      }
    },
    recursiveCommentsCheck(oldCommentsArr, newCommentsArr) {
      debugger;
      const oldComments = oldCommentsArr || this.comments;
      // determine if newCommentsArr length is longer, if so, then in cycle there will be a
      // situation when index return undefined and then that means it's a new comment
      const maxLen = (oldCommentsArr || this.comments).length > newCommentsArr.length
        ? (oldCommentsArr || this.comments).length : newCommentsArr.length;

      for (let i = 0; i < maxLen; i += 1) {
        if (oldComments[i]) {
          if (oldComments[i].children.length > 0) {
            // recursion
            this.recursiveCommentsCheck(oldComments[i].children, newCommentsArr[i].children);
          } else if (newCommentsArr[i].children.length > 0) {
            // if oldComments children length is zero but newCommentsArr is not then that means
            // oldComments got children so we just assign newCommentsArr children to oldComments'
            this.newCommentsCount += 1;
            this.post.commentCount += 1;
            oldComments[i].children = newCommentsArr[i].children;
            // make every single child get styles of a new comment
            for (let j = 0; j < oldComments[i].children.length; j += 1) {
              oldComments[i].children[j].isRefreshNew = true;
            }
          }
          // it's new comment
        } else {
          oldComments.push({
            ...newCommentsArr[i],
            isRefreshNew: true,
          });
          this.newCommentsCount += 1;
          this.post.commentCount += 1;
        }
      }
    },
    async sendComment() {
      this.sendCommentLoading = true;
      const res = await api.comments.createComment({
        post: this.post.id,
        body: this.sendCommentBody,
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
        this.post.commentCount = this.post.commentCount + 1;
        this.comments.unshift(newComment);
        this.sendCommentBody = '';
      }
      this.sendCommentLoading = false;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors.scss';

.comments {
  border: 1px solid $light-gray;
  padding: 1rem;
  margin-bottom: 2rem;
  &__update {
    cursor: pointer;
    background: $widget-bg;
    padding: 0.3rem;
    position: sticky;
    top: 50%;
    display: inline-block;
    border-radius: 5px;
    opacity: 0.5;
    transition: opacity 0.1s ease-out;
    &:hover {
      opacity: 1;
    }
    width: 1rem;
    height: 1rem;
    border: 1px solid $light-gray;
    svg {
      fill: $light-gray;
      width: 1rem;
      height: 1rem;
    }
    span {
      color: $firm;
      position: absolute;
    }
    &_refreshing svg {
      animation: spin 0.5s linear infinite;
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }

        100% {
          transform: rotate(360deg)
        }
      }
    }
  }
  &__form {
    width: 85%;
    padding: 1rem;
    margin-top: 0.5rem;
    &_disabled {
      border: 1px solid $light-gray;
      background: $widget-bg;
      color: $main-text;
    }
    .text-editor {
      height: 6rem;
    }
    &-title {
      color: $main-text;
      font-size: 1.2rem;
    }
  }
  &__title {
    color: $main-text;
    margin-top: -2rem;
    &-number {
      font-weight: bold;
    }
  }
  &__no-comments {
    color: $main-text;
    font-size: 1.2rem;
    text-align: center;
    margin-top: 0.5rem;
  }
  &__loading {
    display: flex;
    justify-content: center;
  }
}
</style>
