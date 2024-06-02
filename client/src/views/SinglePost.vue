<template>
  <div>
    <div class="post-container">
      <Post v-if="showPost" :post="post" :can-edit="$postCanEdit(post)" />
    </div>

    <div id="comments" ref="comments" class="comments">
      <NewCommentForm
        v-if="!commentsLoading"
        :post-id="post.id"
        @new-comment="handleNewComment"
      />

      <Comments
        v-if="!commentsLoading && comments.length > 0"
        :data="comments"
        :indent-level="1"
        :post="post.id"
        :level="0"
        :first="true"
      />
      <div v-else-if="!commentsLoading" class="comments__no-comments">
        There are no comments yet... Be the first!
      </div>
      <div v-else class="comments__loading">
        <CircularLoader />
      </div>
    </div>

    <div
      v-if="comments.length > 0 && curPage !== maxPages"
      class="comments__load-more"
      @click="loadMoreComments()"
    >
      <template v-if="moreCommentsLoading">
        <CircularLoader />
      </template>
      <template v-else> Click here to see more comments </template>
    </div>

    <div
      v-if="comments.length > 0 && curPage === maxPages"
      class="comments__no-more"
    >
      You've read all the comments. Now it's your turn to share your thoughts!
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import api from '@/api';
import consts from '@/const/const';
import Comments from '@components/Comment/Comments.vue';
import NewCommentForm from '@components/Comment/NewCommentForm.vue';
import Post from '@components/Post/Post.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

export default {
  components: {
    Post,
    NewCommentForm,
    Comments,
    CircularLoader,
  },
  async beforeRouteEnter(to, from, next) {
    const post = await api.posts.getPostBySlug(to.params.slug);

    if (post.data.error) {
      next({
        name: 'NotFound',
      });
    } else {
      next((vm) => vm.setPost(post.data));
    }
  },
  data() {
    return {
      post: {},
      showPost: false,
      comments: [],
      commentsLoading: true,
      moreCommentsLoading: false,
      curPage: 1,
      maxPages: 1,
    };
  },
  computed: {
    ...mapState({
      user: (state) => state.user,
    }),
  },
  methods: {
    async setPost(post) {
      this.post = post;
      // TODO: Remove this logic
      this.showPost = true;
      window.document.title = `${this.post.title} | Smiler`;

      // comments

      this.commentsLoading = true;

      // TODO: Come up with a way to track new comments user didn't see yet
      // e.g. save in store seen comments and then check if each comment is in there
      const res = await api.comments.getComments({
        limit: consts.COMMENTS_INITIAL_COUNT,
        post: post.id,
      });

      this.comments = res.data.comments;
      this.maxPages = res.data.pages;
      this.commentsLoading = false;
    },
    async loadMoreComments() {
      this.moreCommentsLoading = true;

      const res = await api.comments.getComments({
        limit: consts.COMMENTS_INITIAL_COUNT,
        post: this.post.id,
        offset: 0 + this.curPage * consts.COMMENTS_INITIAL_COUNT,
      });

      if (!res.data.error) {
        this.comments = this.comments.concat(res.data.comments);
        this.curPage = this.curPage + 1;
      }

      this.moreCommentsLoading = false;
    },
    handleNewComment(newComment) {
      this.post.commentCount = this.post.commentCount + 1;
      this.comments.unshift(newComment);
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.post-container {
  margin-bottom: 1.5rem;
}

.comments {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid $light-gray;

  @include for-size(phone-only) {
    border: none;
  }

  &__loading {
    display: flex;
    justify-content: center;
  }

  &__no-comments {
    margin-top: 0.5rem;
    color: $main-text;
    text-align: center;
    font-size: 1.2rem;
  }

  &__load-more,
  &__no-more {
    margin-top: 0.5rem;
    color: $main-text;
    text-align: center;
    font-size: 1.2rem;

    @include widget;
  }

  &__load-more {
    cursor: pointer;
  }
}
</style>
