<template>
  <button
    :type="attrType"
    :data-testid="dataTestid"
    class="base-button"
    :class="{
      [`base-button--${type}`]: Boolean(type),
      [`base-button--${size}`]: Boolean(size),
      'base-button--stretched': stretched,
      'base-button--loading': loading,
      'base-button--active': active,
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
  /**
   * `primary` is filled, for the one main action of a form or dialog.
   * `danger` is filled red, for confirming something destructive.
   * `secondary` is a neutral outline, for everything else.
   * `ghost` has no border, for the lesser of two actions side by side.
   */
  type?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  stretched?: boolean;
  /** Renders the button as the currently chosen one, for toggles and switches */
  active?: boolean;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'button',
  attrType: 'button',
  type: 'secondary',
  size: 'small',
  disabled: false,
  loading: false,
  stretched: false,
  active: false,
});
</script>

<style>
.base-button {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 200ms ease-out;

  &--primary,
  &--danger {
    color: var(--color-text-on-fill);
  }

  /* Hover darkens in both themes: lightening would take the white text below 4.5:1 */
  &--primary {
    border-color: var(--color-primary-fill);
    background: var(--color-primary-fill);

    @media (--hover) {
      &:hover {
        border-color: color-mix(in srgb, var(--color-primary-fill) 85%, #000);
        background: color-mix(in srgb, var(--color-primary-fill) 85%, #000);
      }
    }
  }

  &--danger {
    border-color: var(--color-danger-fill);
    background: var(--color-danger-fill);

    @media (--hover) {
      &:hover {
        border-color: color-mix(in srgb, var(--color-danger-fill) 85%, #000);
        background: color-mix(in srgb, var(--color-danger-fill) 85%, #000);
      }
    }
  }

  &--secondary {
    border-color: var(--color-border-hover);
    background: var(--color-surface-primary);
    color: var(--color-text-primary);

    @media (--hover) {
      &:hover {
        border-color: var(--color-text-secondary);
        background: var(--color-surface-secondary);
      }
    }
  }

  &--ghost {
    background: transparent;
    color: var(--color-primary-strong);

    @media (--hover) {
      &:hover {
        background: var(--color-accent-transparent);
      }
    }
  }

  /* After the variants, so it overrides their colors */
  &[disabled] {
    border-color: var(--color-border);
    background: transparent;
    color: var(--color-text-disabled);
    pointer-events: none;
  }

  &--medium {
    padding: 10px 20px;
    font-size: 14px;
  }

  &--large {
    padding: 12px 24px;
    font-size: 16px;
  }

  @media (--pointer-coarse) {
    min-height: 44px;
  }

  &--active {
    border-color: var(--color-primary);
    background: var(--color-accent-transparent);
    color: var(--color-primary-strong);

    /* The variants' hover would otherwise win and hide the chosen state */
    @media (--hover) {
      &:hover {
        border-color: var(--color-primary);
        background: var(--color-accent-transparent);
        color: var(--color-primary-strong);
      }
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
