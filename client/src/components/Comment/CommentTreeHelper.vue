<template>
  <comments :data="data" :indent-level="2"/>
</template>

<script>

export default {
  components: {
    Comments: () => import('./Comments'),
  },
  props: ['data', 'indentLevel'],
};
</script>
