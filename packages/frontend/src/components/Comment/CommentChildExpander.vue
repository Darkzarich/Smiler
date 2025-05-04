<template>
  <div
    class="comment-child-expander"
    :class="{
      'comment-child-expander--expanded': isExpanded,
    }"
  >
    {{ isExpanded ? '[-]' : '[+]' }}
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    isExpanded: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss">
.comment-child-expander {
  display: inline-block;
  position: absolute;
  margin-top: 16px;
  margin-left: -10px;
  color: var(--color-primary);
  font-family: monospace;
  font-weight: bold;
  cursor: pointer;
  transition: color 200ms ease-out;

  &:hover {
    color: var(--color-primary);
  }

  &--expanded {
    color: var(--color-gray-light);
  }
}
</style>
