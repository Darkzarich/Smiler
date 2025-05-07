<template>
  <div
    class="comment-child-expander"
    :class="{
      'comment-child-expander--expanded': isExpanded,
    }"
  >
    {{ isExpanded ? '-' : '+' }}
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
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  width: 12px;
  height: 12px;
  margin-top: 20px;
  margin-left: -18px;
  border: 1px solid currentcolor;
  background: var(--color-bg);
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
