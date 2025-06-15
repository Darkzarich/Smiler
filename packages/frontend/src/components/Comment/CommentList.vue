<template>
  <div class="comment-list">
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="comment-list__comment"
    >
      <CommentItem
        :comment="comment"
        :post-id="postId"
        :level="level"
        @remove="handleRemoveComment(comment.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CommentItem from './CommentItem.vue';
import type { Comment } from './types';

interface Props {
  data: Comment[];
  postId: string;
  level?: number;
}

const props = withDefaults(defineProps<Props>(), {
  level: 1,
});

const comments = ref(props.data);

const handleRemoveComment = (id: string) => {
  const commentIndex = comments.value.findIndex((comment) => comment.id === id);

  if (commentIndex === -1) {
    return;
  }

  comments.value.splice(commentIndex, 1);
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.comment-list {
  &__comment {
    @include mixins.for-size(phone-only) {
      margin-left: -1rem;
    }
  }
}
</style>
