<template>
  <CommentList :data="data" :post-id="postId" :level="level" />
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';

export default defineComponent({
  components: {
    CommentList: defineAsyncComponent(
      () => import('@components/Comment/CommentList.vue'),
    ),
  },
  props: ['data', 'postId', 'level'],
});
</script>
