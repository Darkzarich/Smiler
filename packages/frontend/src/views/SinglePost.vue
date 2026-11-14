<template>
  <div>
    <NotFound v-if="isNotFound" />

    <template v-else-if="post">
      <div class="post-container">
        <Post
          v-model:post="post"
          :can-edit="checkCanEditPost(post, userStore.user?._id)"
          :collapsible="false"
          @deleted="router.push({ name: 'Home' })"
        />
      </div>

      <div id="comments" class="comments">
        <NewCommentForm
          v-if="!isFetchingComments"
          :post-id="post._id"
          @new-comment="handleAddNewComment"
        />

        <CommentList
          v-if="!isFetchingComments && comments.length > 0"
          ref="commentList"
          :data="comments"
          :indent-level="1"
          :post-id="post._id"
          :level="0"
          :is-first="true"
          @remove="incrementCommentCount(-1)"
          @reply-created="incrementCommentCount(1)"
        />

        <div
          v-else-if="!isFetchingComments"
          class="comments__no-comments u-widget"
        >
          It’s quiet here — be the first to leave a comment!
        </div>

        <div v-else class="comments__loading">
          <CircularLoader />
        </div>
      </div>

      <div
        v-if="!isFetchingComments && hasCommentsNextPage"
        class="comments__show-more"
      >
        <BaseButton
          data-testid="comments-show-more"
          size="medium"
          stretched
          :loading="isFetchingMoreComments"
          @click="fetchMoreComments()"
        >
          Show more comments
        </BaseButton>
      </div>

      <div
        v-if="comments.length > 0 && !hasCommentsNextPage"
        class="comments__no-more u-widget"
      >
        You've read all the comments. Now it's your turn to share your thoughts!
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeMount, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import { commentTypes } from '@/api/comments';
import { postTypes } from '@/api/posts';
import CommentList from '@/components/Comment/CommentList.vue';
import * as consts from '@/const';
import { useUserStore } from '@/store/user';
import { checkCanEditPost } from '@/utils/check-can-edit-post';
import NotFound from '@/views/NotFound.vue';
import BaseButton from '@common/BaseButton.vue';
import NewCommentForm from '@components/Comment/NewCommentForm.vue';
import Post from '@components/Post/Post.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();

const post = ref<postTypes.Post | null>(null);

const isNotFound = ref(false);

const comments = ref<commentTypes.Comment[]>([]);

const commentsCurrentPage = ref(0);
const hasCommentsNextPage = ref(false);

const isFetchingComments = ref(true);
const isFetchingMoreComments = ref(false);

const commentList = useTemplateRef('commentList');

const getCommentsPage = (postId: string, page: number) =>
  api.comments.getComments({
    limit: consts.COMMENTS_INITIAL_COUNT,
    post: postId,
    offset: page * consts.COMMENTS_INITIAL_COUNT,
  });

const fetchComments = async () => {
  if (!post.value) {
    return;
  }

  try {
    isFetchingComments.value = true;

    const data = await getCommentsPage(post.value._id, 0);

    comments.value = data.comments;
    commentsCurrentPage.value = 0;
    hasCommentsNextPage.value = data.hasNextPage;
  } finally {
    isFetchingComments.value = false;
  }
};

const fetchMoreComments = async () => {
  if (!post.value || isFetchingMoreComments.value) {
    return;
  }

  try {
    isFetchingMoreComments.value = true;

    const nextPage = commentsCurrentPage.value + 1;
    const data = await getCommentsPage(post.value._id, nextPage);
    // Pages are offsets into a rating sort, so a comment whose rating changed,
    // or one pushed down by the reader's own new comment, comes back twice
    const shownIds = new Set(comments.value.map((comment) => comment._id));
    const newComments = data.comments.filter(
      (comment) => !shownIds.has(comment._id),
    );

    comments.value.push(...newComments);
    commentsCurrentPage.value = nextPage;
    hasCommentsNextPage.value = data.hasNextPage;

    // Focus would otherwise stay on the button, or fall back to the page when
    // the last page removes it
    const focusTarget =
      newComments[0] ?? (!data.hasNextPage && comments.value.at(-1));

    if (focusTarget) {
      await nextTick();
      commentList.value?.focusComment(focusTarget._id);
    }
  } finally {
    isFetchingMoreComments.value = false;
  }
};

const fetchPostBySlug = async () => {
  try {
    const fetchedPost = await api.posts.getPostBySlug({
      slug: route.params.slug as string,
    });

    post.value = fetchedPost;

    window.document.title = `${post.value?.title} | Smiler`;

    // TODO: Come up with a way to track new comments user didn't see yet
    // e.g. save in store seen comments and then check if each comment is in there
    fetchComments();
  } catch {
    // In place: a push would leave the bad address behind it, which Back returns to
    isNotFound.value = true;
  }
};

const handleAddNewComment = (newComment: commentTypes.Comment) => {
  if (!post.value) {
    return;
  }

  post.value.commentCount = post.value.commentCount + 1;
  comments.value.unshift(newComment);
};

const incrementCommentCount = (value: number) => {
  if (!post.value) {
    return;
  }

  post.value.commentCount = post.value.commentCount + value;
};

onBeforeMount(async () => {
  fetchPostBySlug();
});
</script>

<style>
.post-container {
  margin-bottom: 1.5rem;
}

.comments {
  margin-bottom: 2rem;
  padding-block: 1rem;

  @media (--phone-only) {
    padding: 0;
    border: none;
  }

  &__loading {
    display: flex;
    justify-content: center;
  }

  &__no-comments {
    margin-top: 1rem;

    /* TODO: Set this text for <body> and remove everywhere else */
    color: var(--color-text-primary);
    text-align: center;
    font-size: 1.2rem;
  }

  &__show-more {
    margin-top: 0.5rem;

    /* Phones have no page gutter, so line it up with the comments' text instead */
    @media (--phone-only) {
      padding-inline: 1rem;
    }
  }

  &__no-more {
    margin-top: 0.5rem;
    color: var(--color-text-primary);
    text-align: center;
    font-size: 1.2rem;
  }
}
</style>
