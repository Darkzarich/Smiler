<template>
  <div>
    <div
      v-for="comment in data"
      :style="`margin-left: ${indentLevel}rem`"
      :key="comment.id"
    >
      <div>
        {{ comment.author.login }}
      </div>
      <div>
        {{ comment.body }}
      </div>
      <div v-if="comment.children.length > 0">
        <comment-tree-helper :data="comment.children" :indent-level="indentLevel"/>
      </div>
    </div>
  </div>
</template>

<script>
import CommentTreeHelper from './CommentTreeHelper'

export default {
  components: {
    CommentTreeHelper,
  },
  props: ['data', 'indentLevel'],
}
</script>

<style>

</style>
