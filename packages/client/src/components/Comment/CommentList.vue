<template>
  <div class="comment-list">
    <div
      v-for="comment in comments"
      :key="comment.id"
      class="comment-list__comment"
      :class="{
        'comment-list__comment--first': isFirst,
      }"
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
import CommentItem from './CommentItem.vue';

export default {
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
    isFirst: {
      type: Boolean,
      default: false,
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
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.comment-list {
  &__comment {
    margin-left: 32px;
    border-left: solid 1px var(--color-gray-light);
    color: var(--color-main-text);

    &--first {
      margin-left: 0 !important;
      border-left: none !important;

      @include for-size(phone-only) {
        margin-left: -1rem !important;
      }
    }
  }
}
</style>
