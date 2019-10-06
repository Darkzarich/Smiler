<template>
  <div>
    <div class="post-container">
      <post v-if="showPost" :post="post" :can-edit="$postCanEdit(post)"/>
    </div>

    <div class="comments" id="comments">
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
        :user="user.login"
        :post="post.id"
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
    };
  },
  components: {
    Post,
    TextEditorElement,
    ButtonElement,
    Comments,
    loadingIcon,
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
