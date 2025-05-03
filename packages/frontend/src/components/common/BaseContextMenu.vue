<template>
  <Transition name="base-context-menu">
    <ul
      v-if="show"
      data-testid="base-context-menu"
      class="base-context-menu"
      :style="getPositionStyle"
    >
      <li
        v-for="item in list"
        :key="item.title"
        class="base-context-menu__item"
        @click="item.callback(target)"
      >
        {{ item.title }}
      </li>
    </ul>
  </Transition>
</template>

<script>
export default {
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    posX: {
      type: Number,
      default: 0,
    },
    posY: {
      type: Number,
      default: 0,
    },
    list: {
      type: Array,
      default: () => [],
    },
    target: {
      type: String,
      default: '',
    },
  },
  computed: {
    getPositionStyle() {
      return {
        // offset for every single element + abs offset
        top: `${Number(this.posY) - 30 * this.list.length - 30}px`,
        left: `${this.posX}px`,
      };
    },
  },
};
</script>

<style lang="scss">
.base-context-menu {
  position: absolute;
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
