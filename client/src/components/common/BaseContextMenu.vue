<template>
  <Transition name="base-context-menu">
    <ul
      v-if="show"
      data-testid="base-context-menu"
      class="base-context-menu"
      :style="getPositionStyle"
    >
      <li
        v-for="item in list.filter((el) => filter(el))"
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
    filter: {
      type: Function,
      default: () => true,
    },
  },
  computed: {
    getPositionStyle() {
      return {
        // offset for every single element + abs offset
        top: `${Number(this.posY) - 30 * this.list.filter((el) => this.filter(el)).length - 30}px`,
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
  border: 1px solid var(--color-light-gray);
  background: var(--color-bg);
  list-style: none;

  &-enter-active,
  &-leave-active {
    transition: all 0.1s;
  }

  &-enter,
  &-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }

  &__item {
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-light-gray);
    color: var(--color-main-text);
    font-size: 0.9rem;
    cursor: pointer;

    &:hover {
      background: var(--color-widget-bg);
    }

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
