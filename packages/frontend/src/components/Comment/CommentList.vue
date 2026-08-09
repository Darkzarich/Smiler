<template>
  <div class="comment-list">
    <div
      v-for="comment in comments"
      :key="comment._id"
      class="comment-list__comment"
    >
      <CommentItem
        :comment="comment"
        :post-id="postId"
        :level="level"
        @remove="handleRemoveComment"
        @reply-created="emit('reply-created')"
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

interface Emits {
  remove: [id: string];
  'reply-created': [];
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
});

const emit = defineEmits<Emits>();

const comments = ref(props.data);

const handleRemoveComment = (id: string) => {
  const commentIndex = comments.value.findIndex(
    (comment) => comment._id === id,
  );

  if (commentIndex === -1) {
    return;
  }

  comments.value.splice(commentIndex, 1);

  emit('remove', id);
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
