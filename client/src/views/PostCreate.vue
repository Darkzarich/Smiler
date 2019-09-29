<template>
  <div class="post-create">
    <div class="post-create__header">
      Create Post
    </div>
    <post-editor/>
  </div>
</template>

<script>
import PostEditor from '@/components/PostEditor/PostEditor';

export default {
  components: {
    PostEditor,
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins.scss';
@import '@/styles/colors.scss';

.post-create {
  @include widget();
  @include flex-col();
  &__header {
    align-self: center;
    font-size: 1.5rem;
    color: $main-text;
  }
}

</style>
