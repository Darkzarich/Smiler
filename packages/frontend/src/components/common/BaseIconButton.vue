<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : attrType"
    :data-testid="dataTestid"
    class="base-icon-button"
    :class="[
      `base-icon-button--${size}`,
      `base-icon-button--${tone}`,
      { 'base-icon-button--pressed': pressed },
    ]"
    :aria-label="label"
    :aria-pressed="pressed"
    :title="label"
    :disabled="to ? undefined : disabled"
  >
    <span class="base-icon-button__face">
      <slot />
    </span>
  </component>
</template>

<script setup lang="ts">
import { type RouteLocationRaw, RouterLink } from 'vue-router';

interface Props {
  /** The accessible name: an icon alone says nothing to a screen reader */
  label: string;
  dataTestid?: string;
  attrType?: 'button' | 'submit' | 'reset';
  /** The visible box. The hit area never drops below 24px (44px on touch screens) */
  size?: 'xsmall' | 'small' | 'medium';
  /**
   * The color the icon takes on hover and while pressed. `inherit` follows the
   * surrounding text, for an icon on a colored surface
   */
  tone?: 'neutral' | 'primary' | 'danger' | 'warning' | 'inherit';
  /** Makes it a toggle. Undefined for a plain action, so no aria-pressed */
  pressed?: boolean;
  disabled?: boolean;
  /** Makes it a link, for an icon-only control that opens another page */
  to?: RouteLocationRaw;
}

withDefaults(defineProps<Props>(), {
  dataTestid: undefined,
  attrType: 'button',
  size: 'small',
  tone: 'neutral',
  pressed: undefined,
  disabled: false,
  to: undefined,
});
</script>

<style>
.base-icon-button {
  --icon-button-box: 28px;
  --icon-button-glyph: 20px;
  --icon-button-hit: 24px;
  --icon-button-accent: var(--color-text-primary);

  display: inline-flex;
  flex: none;
  justify-content: center;
  align-items: center;
  position: relative;
  width: var(--icon-button-box);
  height: var(--icon-button-box);
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    color 200ms ease-out,
    background-color 200ms ease-out;

  @media (--pointer-coarse) {
    --icon-button-hit: 44px;
  }

  /* Grows the hit area past a small box without moving anything around it */
  &::before {
    position: absolute;
    content: '';
    inset: min(0px, calc((100% - var(--icon-button-hit)) / 2));
  }

  /* Lifted over the hit areas, so where two buttons sit close together the
     grown area of one never takes a tap that lands on the other's icon */
  &__face {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 1;
    inset: 0;
  }

  svg {
    width: var(--icon-button-glyph);
    height: var(--icon-button-glyph);
    fill: currentcolor;
  }

  &--xsmall {
    --icon-button-box: 20px;
    --icon-button-glyph: 16px;

    border-radius: 4px;
  }

  &--medium {
    --icon-button-box: 36px;
    --icon-button-glyph: 22px;
  }

  &--primary {
    --icon-button-accent: var(--color-primary-strong);
  }

  &--danger {
    --icon-button-accent: var(--color-danger-strong);
  }

  &--warning {
    --icon-button-accent: var(--color-warning);
  }

  &--inherit {
    --icon-button-accent: currentcolor;

    color: inherit;
  }

  @media (--hover) {
    &:hover {
      background: var(--color-surface-secondary);
      color: var(--icon-button-accent);
    }

    &--inherit:hover {
      background: color-mix(in srgb, currentcolor 15%, transparent);
    }
  }

  &--pressed,
  &[aria-expanded='true'] {
    color: var(--icon-button-accent);
  }

  &--neutral.base-icon-button--pressed,
  &--neutral[aria-expanded='true'] {
    color: var(--color-primary-strong);
  }

  &[disabled] {
    color: var(--color-text-disabled);
    pointer-events: none;
  }
}
</style>
