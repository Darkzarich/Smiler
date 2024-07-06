<template>
  <CommentList :data="data" :post="post" :level="level + 1" :indent-level="2" />
</template>

<script>
export default {
  components: {
    CommentList: () => import('./CommentList.vue'),
  },
  props: ['data', 'indentLevel', 'post', 'level'],
};
</script>
