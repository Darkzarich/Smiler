<template>
  <Transition name="base-context-menu">
    <ul
      v-if="show"
      ref="menuRef"
      data-testid="base-context-menu"
      class="base-context-menu"
      role="menu"
      tabindex="-1"
      :style="positionStyle"
      @keydown="onKeydown"
    >
      <li v-for="item in items" :key="item.value" role="none">
        <button
          type="button"
          class="base-context-menu__item"
          role="menuitem"
          tabindex="-1"
          @click="$emit('action', item.value)"
        >
          {{ item.label }}
        </button>
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

const emit = defineEmits<{
  action: [value: string];
  close: [];
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

const getItems = () => [
  ...(menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
];

const focusItem = (index: number) => {
  const items = getItems();

  items[(index + items.length) % items.length]?.focus();
};

const returnFocus = () => {
  if (menuRef.value?.contains(document.activeElement)) {
    props.anchor?.focus();
  }
};

const onKeydown = (ev: KeyboardEvent) => {
  const current = getItems().indexOf(document.activeElement as HTMLElement);

  switch (ev.key) {
    case 'ArrowDown':
      focusItem(current + 1);
      break;
    case 'ArrowUp':
      focusItem(current - 1);
      break;
    case 'Home':
      focusItem(0);
      break;
    case 'End':
      focusItem(-1);
      break;
    case 'Escape':
      emit('close');
      break;
    case 'Tab':
      // Not prevented: from the anchor, Tab goes on to whatever follows it
      returnFocus();
      emit('close');
      return;
    default:
      return;
  }

  ev.preventDefault();
};

// The menu has to be in the DOM to be measured and focused
watch(
  () => [props.show, props.anchor],
  () => {
    place();

    if (props.show) {
      focusItem(0);
    }
  },
  { flush: 'post' },
);

// Before the menu leaves the DOM, while it can still hold the focus
watch(
  () => props.show,
  (show) => {
    if (!show) {
      returnFocus();
    }
  },
);
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
    width: 100%;
    padding: 0.5rem;
    border: none;
    background: var(--color-surface-secondary);
    color: var(--color-text-primary);
    text-align: start;
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 200ms ease-out;

    @media (--hover) {
      &:hover {
        background: var(--color-surface-primary);
      }
    }

    &:focus-visible {
      background: var(--color-surface-primary);

      /* Inside the item, where the menu's edge and its neighbors can't cover it */
      outline-offset: -2px;
    }

    @media (--pointer-coarse) {
      min-height: 44px;
    }

    li:first-child > & {
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }

    li:last-child > & {
      border-bottom-right-radius: 8px;
      border-bottom-left-radius: 8px;
    }
  }
}
</style>
