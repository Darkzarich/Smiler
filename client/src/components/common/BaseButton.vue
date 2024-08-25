<template>
  <button
    :data-testid="dataTestid"
    type="button"
    class="base-button"
    :class="{
      'base-button--stretched': stretched,
      'base-button--loading': loading,
    }"
    :disabled="disabled"
  >
    <template v-if="!loading">
      <slot />
    </template>

    <CircularLoader v-else class="base-button__loader" />
  </button>
</template>

<script>
import CircularLoader from '@icons/animation/CircularLoader.vue';

export default {
  components: {
    CircularLoader,
  },
  props: {
    dataTestid: {
      type: String,
      default: 'button',
    },
    disabled: {
      type: [Boolean, String],
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    stretched: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.base-button {
  display: flex;
  justify-content: center;
  padding: 8px;
  outline: none;
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  background: var(--color-bg);
  color: var(--color-primary);
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 200ms ease-out;

  &:hover {
    background: var(--color-widget-bg);
  }

  &[disabled] {
    border: 2px solid var(--color-gray-light);
    color: var(--color-gray-light);
    pointer-events: none;
  }

  &--loading {
    opacity: 0.5;
    border: 2px solid rgb(var(--color-primary) 0.5);
    pointer-events: none;
    user-select: none;
  }

  &--stretched {
    width: 100%;
  }

  &__loader {
    width: 15px;
    height: 15px;
  }
}
</style>
