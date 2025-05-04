<template>
  <div>
    <div class="post-container">
      <Post v-if="post" :post="post" :can-edit="checkCanEditPost(post)" />
    </div>

    <div id="comments" ref="comments" class="comments">
      <NewCommentForm
        v-if="!isFetchingComments"
        :post-id="post.id"
        @new-comment="handleAddNewComment"
      />

      <CommentList
        v-if="!isFetchingComments && comments.length > 0"
        :data="comments"
        :indent-level="1"
        :post-id="post.id"
        :level="0"
        :is-first="true"
      />

      <div v-else-if="!isFetchingComments" class="comments__no-comments">
        "It’s quiet here — be the first to leave a comment!"
      </div>

      <div v-else class="comments__loading">
        <CircularLoader />
      </div>
    </div>

    <div
      v-if="!isFetchingComments && hasCommentsNextPage"
      class="comments__fetch-more"
      @click="fetchMoreComments()"
    >
      <template v-if="isFetchingComments">
        <CircularLoader />
      </template>
      <template v-else> Click here to see more comments </template>
    </div>

    <div
      v-if="comments.length > 0 && !hasCommentsNextPage"
      class="comments__no-more"
    >
      You've read all the comments. Now it's your turn to share your thoughts!
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { mapState } from 'vuex';
import api from '@/api';
import CommentList from '@/components/Comment/CommentList.vue';
import consts from '@/const/const';
import { checkCanEditPost } from '@/utils/check-can-edit-post';
import NewCommentForm from '@components/Comment/NewCommentForm.vue';
import Post from '@components/Post/Post.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

export default defineComponent({
  components: {
    Post,
    NewCommentForm,
    CommentList,
    CircularLoader,
  },
  async beforeRouteEnter(to, from, next) {
    const post = await api.posts.getPostBySlug(to.params.slug);

    if (post.data.error) {
      next({
        name: 'NotFound',
      });
    } else {
      next((vm) => vm.handleSetPost(post.data));
    }
  },
  data() {
    return {
      post: null,
      comments: [],
      isFetchingComments: true,
      commentsCurrentPage: 0,
      hasCommentsNextPage: false,
    };
  },
  computed: {
    ...mapState({
      user: (state) => state.user,
    }),
  },
  methods: {
    checkCanEditPost,
    async handleSetPost(post) {
      this.post = post;

      window.document.title = `${this.post.title} | Smiler`;

      // comments

      // TODO: Come up with a way to track new comments user didn't see yet
      // e.g. save in store seen comments and then check if each comment is in there
      this.fetchComments();
    },
    /**
     *
     * @param {Object} options
     * @param {boolean=} options.isCombine - if true, posts are concatenated to the existing array
     */
    async fetchComments({ isCombine } = {}) {
      this.isFetchingComments = true;

      const res = await api.comments.getComments({
        limit: consts.COMMENTS_INITIAL_COUNT,
        post: this.post.id,
        offset: 0 + this.commentsCurrentPage * consts.COMMENTS_INITIAL_COUNT,
      });

      if (res && !res.data.error) {
        this.hasCommentsNextPage = res.data.hasNextPage;

        if (isCombine) {
          this.comments = this.comments.concat(res.data.comments);
        } else {
          this.comments = res.data.comments;
        }
      }

      this.isFetchingComments = false;
    },
    async fetchMoreComments() {
      this.commentsCurrentPage = this.commentsCurrentPage + 1;
      this.fetchComments({ isCombine: true });
    },
    handleAddNewComment(newComment) {
      this.post.commentCount = this.post.commentCount + 1;
      this.comments.unshift(newComment);
    },
  },
});
</script>

<style lang="scss">
@import '@/styles/mixins';

.post-container {
  margin-bottom: 1.5rem;
}

.comments {
  margin-bottom: 2rem;
  padding: 1rem;

  @include for-size(phone-only) {
    padding: 0;
    border: none;
  }

  &__loading {
    display: flex;
    justify-content: center;
  }

  &__no-comments {
    margin-top: 0.5rem;

    // TODO: Set this text for <body> and remove everywhere else
    color: var(--color-main-text);
    text-align: center;
    font-size: 1.2rem;
  }

  &__fetch-more,
  &__no-more {
    margin-top: 0.5rem;
    color: var(--color-main-text);
    text-align: center;
    font-size: 1.2rem;

    @include widget;
  }

  &__fetch-more {
    cursor: pointer;
  }
}
</style>
