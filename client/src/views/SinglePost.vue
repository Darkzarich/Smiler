<template>
  <div>
    <div class="post-container">
      <Post v-if="showPost" :post="post" :can-edit="$postCanEdit(post)" />
    </div>

    <div id="comments" ref="comments" class="comments">
      <div
        title="Refresh comments"
        :class="commentsRefreshing ? 'comments__update--refreshing' : ''"
        class="comments__update"
        @click="refreshComments()"
      >
        <IconRefresh />
        <template v-if="newCommentsCount > 0">
          <span>+{{ newCommentsCount }}</span>
        </template>
      </div>

      <div class="comments__count">
        Commentaries (
        <span class="comments__count-value"> {{ post.commentCount }} </span> )
      </div>

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
import IconRefresh from '@icons/IconRefresh.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

export default {
  components: {
    Post,
    NewCommentForm,
    Comments,
    IconRefresh,
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
      commentsRefreshing: false,
      newCommentsCount: 0,
      curPage: 1,
      maxPages: 1,
      moreCommentsLoading: false,
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
      this.showPost = true;
      window.document.title = `${this.post.title} | Smiler`;

      // comments

      this.commentsLoading = true;

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
    async refreshComments() {
      this.commentsRefreshing = true;

      const res = await api.comments.getComments({
        limit: consts.COMMENTS_INITIAL_COUNT,
        post: this.post.id,
      });

      if (!res.data.error) {
        this.recursiveCommentsCheck(null, res.data.comments);
        this.commentsRefreshing = false;
      }
    },
    recursiveCommentsCheck(oldCommentsArr, newCommentsArr) {
      const oldComments = oldCommentsArr || this.comments;
      // determine if newCommentsArr length is longer, if so, then in cycle there will be a
      // situation when index return undefined and then that means it's a new comment
      const maxLen =
        (oldCommentsArr || this.comments).length > newCommentsArr.length
          ? (oldCommentsArr || this.comments).length
          : newCommentsArr.length;

      for (let i = 0; i < maxLen; i = i + 1) {
        if (oldComments[i]) {
          if (oldComments[i].children.length > 0) {
            // recursion
            this.recursiveCommentsCheck(
              oldComments[i].children,
              newCommentsArr[i].children,
            );
          } else if (newCommentsArr[i].children.length > 0) {
            // if oldComments children length is zero but newCommentsArr is not then that means
            // oldComments got children so we just assign newCommentsArr children to oldComments'
            this.newCommentsCount = this.newCommentsCount + 1;
            this.post.commentCount = this.post.commentCount + 1;
            oldComments[i].children = newCommentsArr[i].children;
            // make every single child get styles of a new comment
            for (let j = 0; j < oldComments[i].children.length; j = j + 1) {
              oldComments[i].children[j].isRefreshNew = true;
            }
          }
          // it's new comment
        } else {
          oldComments.push({
            ...newCommentsArr[i],
            isRefreshNew: true,
          });
          this.newCommentsCount = this.newCommentsCount + 1;
          this.post.commentCount = this.post.commentCount + 1;
        }
      }
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

.comments {
  border: 1px solid $light-gray;
  padding: 1rem;
  margin-bottom: 2rem;

  @include for-size(phone-only) {
    border: none;
  }

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
    width: 1rem;
    height: 1rem;
    border: 1px solid $light-gray;

    &:hover {
      opacity: 1;
    }

    svg {
      fill: $light-gray;
      width: 1rem;
      height: 1rem;
    }

    &--refreshing svg {
      animation: spin 0.5s linear infinite;

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }

        100% {
          transform: rotate(360deg);
        }
      }
    }

    span {
      color: $firm;
      position: absolute;
    }
  }

  &__count {
    color: $main-text;
    margin-top: -2rem;
  }

  &__count-number {
    font-weight: bold;
  }

  &__loading {
    display: flex;
    justify-content: center;
  }

  &__no-comments {
    color: $main-text;
    font-size: 1.2rem;
    text-align: center;
    margin-top: 0.5rem;
  }

  &__load-more,
  &__no-more {
    color: $main-text;
    font-size: 1.2rem;
    text-align: center;
    margin-top: 0.5rem;

    @include widget;
  }

  &__load-more {
    cursor: pointer;
  }
}
</style>
