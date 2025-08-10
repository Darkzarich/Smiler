<template>
  <div>
    <template v-if="post">
      <div class="post-container">
        <Post
          v-model:post="post"
          :can-edit="checkCanEditPost(post, userStore.user?.id)"
        />
      </div>

      <div id="comments" class="comments">
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { commentTypes } from '@/api/comments';
import { postTypes } from '@/api/posts';
import CommentList from '@/components/Comment/CommentList.vue';
import * as consts from '@/const';
import { useUserStore } from '@/store/user';
import { checkCanEditPost } from '@/utils/check-can-edit-post';
import NewCommentForm from '@components/Comment/NewCommentForm.vue';
import Post from '@components/Post/Post.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();

const post = ref<postTypes.Post | null>(null);

const comments = ref<commentTypes.Comment[]>([]);

const commentsCurrentPage = ref(0);
const hasCommentsNextPage = ref(false);

const isFetchingComments = ref(true);

const fetchComments = async ({ isCombine = false } = {}) => {
  if (!post.value) {
    return;
  }

  try {
    isFetchingComments.value = true;

    const data = await api.comments.getComments({
      limit: consts.COMMENTS_INITIAL_COUNT,
      post: post.value.id,
      offset: 0 + commentsCurrentPage.value * consts.COMMENTS_INITIAL_COUNT,
    });

    hasCommentsNextPage.value = data.hasNextPage;

    if (isCombine) {
      comments.value = comments.value.concat(data.comments);
    } else {
      comments.value = data.comments;
    }
  } finally {
    isFetchingComments.value = false;
  }
};

const fetchMoreComments = async () => {
  commentsCurrentPage.value = commentsCurrentPage.value + 1;
  fetchComments({ isCombine: true });
};

const fetchPostBySlug = async () => {
  try {
    const fetchedPost = await api.posts.getPostBySlug(
      route.params.slug as string,
    );

    post.value = fetchedPost;

    window.document.title = `${post.value?.title} | Smiler`;

    // TODO: Come up with a way to track new comments user didn't see yet
    // e.g. save in store seen comments and then check if each comment is in there
    fetchComments();
  } catch {
    router.push({
      name: 'NotFound',
    });
  }
};

const handleAddNewComment = (newComment: commentTypes.Comment) => {
  if (!post.value) {
    return;
  }

  post.value.commentCount = post.value.commentCount + 1;
  comments.value.unshift(newComment);
};

onBeforeMount(async () => {
  fetchPostBySlug();
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.post-container {
  margin-bottom: 1.5rem;
}

.comments {
  margin-bottom: 2rem;
  padding: 1rem;

  @include mixins.for-size(phone-only) {
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

    @include mixins.widget;
  }

  &__fetch-more {
    cursor: pointer;
  }
}
</style>
