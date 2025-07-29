<template>
  <button
    :type="attrType"
    :data-testid="dataTestid"
    class="base-button"
    :class="{
      [`base-button--${type}`]: Boolean(type),
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

<script setup lang="ts">
import CircularLoader from '@icons/animation/CircularLoader.vue';

interface Props {
  dataTestid?: string;
  attrType?: 'button' | 'submit' | 'reset';
  type?: 'primary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  stretched?: boolean;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'button',
  attrType: 'button',
  type: 'primary',
  disabled: false,
  loading: false,
  stretched: false,
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.base-button {
  display: flex;
  justify-content: center;
  padding: 8px;
  outline: none;
  border: 2px solid transparent;
  border-radius: 8px;
  background: var(--color-bg);
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

  &--primary {
    border-color: var(--color-primary);
    color: var(--color-primary);

    &.base-button--loading {
      border-color: rgb(var(--color-primary) 0.5);
    }
  }

  &--danger {
    border-color: var(--color-danger);
    color: var(--color-danger);

    &.base-button--loading {
      border-color: rgb(var(--color-danger) 0.5);
    }
  }

  &--loading {
    opacity: 0.5;
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
