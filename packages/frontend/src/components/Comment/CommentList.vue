<template>
  <div ref="list" class="comment-list">
    <div
      v-for="comment in comments"
      :key="comment._id"
      class="comment-list__comment"
      :data-comment-id="comment._id"
    >
      <CommentItem :comment="comment" :post-id="postId" :level="level" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { provide, toRef, useTemplateRef } from 'vue';
import CommentItem from './CommentItem.vue';
import { commentThreadKey, insertReply, removeComment } from './thread';
import type { Comment } from './types';
import { focusTemporarily } from '@/utils/focus-temporarily';

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

const comments = toRef(props, 'data');

const list = useTemplateRef('list');

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

defineExpose({
  /** Moves focus to a top-level comment's card, e.g. the first of a page just
   * loaded, which a keyboard or screen reader user would otherwise not find */
  focusComment(id: string) {
    const card = list.value?.querySelector<HTMLElement>(
      `[data-comment-id="${id}"] > .comment-item > .comment-item__content`,
    );

    if (card) {
      focusTemporarily(card);
    }
  },
});
</script>
