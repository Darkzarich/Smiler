<template>
  <div data-testid="posts-container" class="posts-container">
    <div v-if="posts.length > 0">
      <Post
        v-for="(post, index) in posts"
        :key="post.id"
        v-model:post="posts[index]"
        class="posts-container__post"
        :can-edit="checkCanEditPost(post, userStore.userId)"
      />
    </div>

    <div
      v-else-if="!isLoading"
      class="posts-container__no-posts"
      data-testid="no-content"
    >
      <slot name="no-content" />
    </div>

    <div v-if="hasNextPage" class="posts-container__no-more">
      <slot name="no-more-content" />
    </div>

    <div v-if="isLoading" class="posts-container__loading">
      <CircularLoader />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core';
import { postTypes } from '@/api/posts';
import { useUserStore } from '@/store/user';
import Post from '@components/Post/Post.vue';
import CircularLoader from '@icons/animation/CircularLoader.vue';
import { checkCanEditPost } from '@utils/check-can-edit-post';

interface Emits {
  'fetch-more': [];
}

const emit = defineEmits<Emits>();

interface Props {
  isLoading?: boolean;
  hasNextPage?: boolean;
}

const props = defineProps<Props>();

const posts = defineModel<postTypes.Post[]>('posts', {
  required: true,
});

const userStore = useUserStore();

useInfiniteScroll(
  typeof window !== 'undefined' ? window : undefined,
  () => emit('fetch-more'),
  {
    // Load when ~1 viewport from bottom (original UX); 400px fallback
    distance: typeof window !== 'undefined' ? window.innerHeight : 400,
    interval: 200,
    canLoadMore: () => !!(props.hasNextPage && !props.isLoading),
  },
);
</script>

<style lang="scss">
@use '@/styles/mixins';

.posts-container {
  &__loading,
  &__no-more,
  &__no-posts {
    margin-left: 10%;
    text-align: center;

    @include mixins.for-size(phone-only) {
      margin-left: 0% !important;
      border: none !important;
      border-radius: 0 !important;
    }
  }

  &__post {
    margin-bottom: var(--variable-widget-margin);
  }

  &__loading {
    @include mixins.widget;
    @include mixins.flex-row;

    justify-content: center;
  }

  &__no-posts,
  &__no-more {
    @include mixins.widget;

    display: flex;
    justify-content: center;
    color: var(--color-main-text);
    text-align: center;
    font-size: 1.3rem;
    line-height: 1.7rem;
  }
}
</style>
