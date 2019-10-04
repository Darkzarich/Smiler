<template>
  <div>
    <div class="post-container">
      <post v-if="showPost" :post="post" :can-edit="$postCanEdit(post)"/>
    </div>

    <div class="comments" id="comments">
      <div class="comments__title">
        Comments ( <span class="comments__title-number"> {{post.commentCount }} </span> )
      </div>
      <comments
        v-if="!commentsLoading && comments.length > 0"
        :data="comments"
        :indent-level="1"
        :user="login"
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
import loadingIcon from '@/library/svg/animation/circularLoader'

import api from '@/api';

import consts from '@/const/const';

export default {
  data() {
    return {
      post: {},
      showPost: false,
      comments: [],
      commentsLoading: false,
    };
  },
  components: {
    Post,
    Comments,
    loadingIcon,
  },
  computed: {
    ...mapState({
      login: state => state.user.login,
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
  },
};
</script>

<style lang="scss">
@import '@/styles/colors.scss';

.comments {
  border: 1px solid $light-gray;
  padding: 1rem;
  margin-bottom: 2rem;
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
