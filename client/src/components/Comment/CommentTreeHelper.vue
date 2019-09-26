<template>
  <comments :data="data" :indent-level="indentLevel + 1"/>
</template>

<script>

export default {
  components: {
    Comments: () => import('./Comments')
  },
  props: ['data', 'indentLevel']
}
</script>
