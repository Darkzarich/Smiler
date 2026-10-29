<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    class="base-tag"
    :class="{
      'base-tag--interactive': interactive,
      'base-tag--with-action': $slots.action,
    }"
  >
    <slot />
    <slot name="action" />
  </component>
</template>

<script setup lang="ts">
interface Props {
  /** Makes it a button, for a tag that does something when picked */
  interactive?: boolean;
}

withDefaults(defineProps<Props>(), {
  interactive: false,
});
</script>

<style>
/* The -strong text color is the one that keeps 4.5:1 on the tint */
.base-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 10px;
  border: none;
  border-radius: 999px;
  background: var(--color-accent-transparent);
  color: var(--color-primary-strong);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 20px;
  user-select: none;

  /* Sized for an xsmall BaseIconButton (20px), so the chip stays 24px tall */
  &--with-action {
    padding-right: 2px;
  }

  &--interactive {
    cursor: pointer;

    /* A ring, not a darker tint: the text would drop under 4.5:1 on one */
    &[aria-expanded='true'] {
      box-shadow: inset 0 0 0 1px var(--color-primary);
    }

    @media (--hover) {
      &:hover {
        box-shadow: inset 0 0 0 1px var(--color-primary);
      }
    }

    @media (--pointer-coarse) {
      min-height: 32px;
      padding-inline: 12px;
    }
  }
}
</style>
