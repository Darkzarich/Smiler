<template>
  <CommentList :data="data" :post-id="postId" :level="level" />
</template>

<script>
export default {
  components: {
    CommentList: () => import('./CommentList.vue'),
  },
  props: ['data', 'postId', 'level'],
};
</script>
