<template>
  <Transition name="base-context-menu">
    <ul
      v-if="show"
      ref="menuRef"
      data-testid="base-context-menu"
      class="base-context-menu"
      :style="positionStyle"
    >
      <li
        v-for="item in items"
        :key="item.value"
        class="base-context-menu__item"
        role="button"
        tabindex="0"
        @click="$emit('action', item.value)"
        @keydown.enter="$emit('action', item.value)"
        @keydown.space.prevent="$emit('action', item.value)"
      >
        {{ item.label }}
      </li>
    </ul>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

type Option = {
  value: string;
  label: string;
};

defineEmits<{
  action: [value: string];
}>();

interface Props {
  show?: boolean;
  anchor?: HTMLElement | null;
  items: Option[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  anchor: null,
});

const GAP = 4;

const menuRef = ref<HTMLElement | null>(null);
const positionStyle = ref({ top: '0px', left: '0px' });

const place = () => {
  const menu = menuRef.value;
  const container = menu?.offsetParent;

  if (!menu || !container || !props.anchor) {
    return;
  }

  const anchorRect = props.anchor.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = menu;

  const fitsBelow = anchorRect.bottom + GAP + height <= window.innerHeight;
  const fitsAbove = anchorRect.top - GAP - height >= 0;
  const top =
    !fitsBelow && fitsAbove
      ? anchorRect.top - GAP - height
      : anchorRect.bottom + GAP;
  const left = Math.max(
    containerRect.left,
    Math.min(anchorRect.left, containerRect.right - width),
  );

  positionStyle.value = {
    top: `${top - containerRect.top}px`,
    left: `${left - containerRect.left}px`,
  };
};

// The menu has to be in the DOM to be measured
watch(() => [props.show, props.anchor], place, { flush: 'post' });
</script>

<style>
.base-context-menu {
  position: absolute;
  z-index: 1;
  margin: 0;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow:
    0 3px 6px -4px rgb(0 0 0 / 24%),
    0 6px 12px 0 rgb(0 0 0 / 16%),
    0 9px 18px 8px rgb(0 0 0 / 10%);
  background: var(--color-surface-secondary);
  list-style: none;

  /* Not `all`: top and left are set on every opening and would slide over
     from where the menu last was */
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.1s,
      transform 0.1s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background: var(--color-surface-secondary);
    color: var(--color-text-primary);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 200ms ease-out;

    &:first-child {
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }

    &:last-child {
      border-bottom-right-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    &:hover {
      background: var(--color-surface-primary);
    }

    @media (--pointer-coarse) {
      min-height: 44px;
    }
  }
}
</style>
