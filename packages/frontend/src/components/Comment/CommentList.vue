<template>
  <div class="comment-list">
    <div
      v-for="comment in comments"
      :key="comment._id"
      class="comment-list__comment"
    >
      <CommentItem :comment="comment" :post-id="postId" :level="level" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue';
import CommentItem from './CommentItem.vue';
import { commentThreadKey, insertReply, removeComment } from './thread';
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

// A reply can land anywhere in the tree: the server may store it under an
// ancestor of the comment answered, and a flat thread shows replies that are
// not the children of the comment rendering them.
provide(commentThreadKey, {
  addReply(reply, answeredId) {
    if (insertReply(comments.value, reply, answeredId)) {
      emit('reply-created');
    }
  },
  remove(id) {
    if (removeComment(comments.value, id)) {
      emit('remove', id);
    }
  },
});
</script>
