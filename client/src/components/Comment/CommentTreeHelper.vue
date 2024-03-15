<template>
  <Comments
    :data="data"
    :post="post"
    :level="level + 1"
    :indent-level="2"
  />
</template>

<script>
export default {
  components: {
    Comments: () => import('./Comments.vue'),
  },
  props: ['data', 'indentLevel', 'post', 'level'],
};
</script>
