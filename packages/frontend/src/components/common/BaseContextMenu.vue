<template>
  <Transition name="base-context-menu">
    <ul
      v-if="show"
      data-testid="base-context-menu"
      class="base-context-menu"
      :style="getPositionStyle"
    >
      <li
        v-for="item in items"
        :key="item.value"
        class="base-context-menu__item"
        @click="$emit('action', item.value)"
      >
        {{ item.label }}
      </li>
    </ul>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Option = {
  value: string;
  label: string;
};

defineEmits<{
  action: [value: string];
}>();

interface Props {
  show?: boolean;
  posX?: number;
  posY?: number;
  items: Option[];
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  posX: 0,
  posY: 0,
  target: '',
});

const getPositionStyle = computed(() => {
  return {
    // offset for every single element + abs offset
    top: `${Number(props.posY) - 30 * props.items.length - 30}px`,
    left: `${props.posX}px`,
  };
});
</script>

<style lang="scss">
.base-context-menu {
  position: absolute;
  z-index: 1;
  margin: 0;
  padding: 0;
  border-radius: 8px;
  box-shadow:
    0 3px 6px -4px rgb(0 0 0 / 24%),
    0 6px 12px 0 rgb(0 0 0 / 16%),
    0 9px 18px 8px rgb(0 0 0 / 10%);
  background: var(--color-gray-light);
  list-style: none;

  &-enter-active,
  &-leave-active {
    transition: all 0.1s;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }

  &__item {
    padding: 0.5rem;
    background: var(--color-gray-light);
    color: var(--color-main-text);
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
      filter: brightness(1.3);
    }
  }
}
</style>
