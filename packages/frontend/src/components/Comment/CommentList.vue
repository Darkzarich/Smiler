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

<script>
import { defineComponent } from 'vue';
import CommentItem from './CommentItem.vue';

export default defineComponent({
  components: {
    CommentItem,
  },
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    postId: {
      type: String,
      default: '',
    },
    level: {
      type: Number,
      default: 1,
    },
  },
  data() {
    return {
      comments: this.data,
    };
  },
  methods: {
    handleRemoveComment(id) {
      const commentIndex = this.comments.findIndex(
        (comment) => comment.id === id,
      );

      if (commentIndex === -1) {
        return;
      }

      this.comments.splice(commentIndex, 1);
    },
  },
});
</script>

<style lang="scss">
@import '@/styles/mixins';

.comment-list {
  &__comment {
    @include for-size(phone-only) {
      margin-left: -1rem;
    }
  }
}
</style>
