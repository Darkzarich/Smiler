<template>
  <comments :data="data" :post="post" :indent-level="2"/>
</template>

<script>

export default {
  components: {
    Comments: () => import('./Comments'),
  },
  props: ['data', 'indentLevel', 'post'],
};
</script>
