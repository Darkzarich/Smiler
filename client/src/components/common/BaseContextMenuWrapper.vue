<template>
  <Transition name="context-menu">
    <div
      v-if="show"
      data-testid="context-menu"
      class="context-menu"
      :style="getPositionStyle"
    >
      <ul class="context-menu__list">
        <li
          v-for="item in list.filter((el) => filter(el))"
          :key="item.title"
          class="context-menu__item"
          @click="item.callback(target)"
        >
          {{ item.title }}
        </li>
      </ul>
    </div>
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
@import '@/styles/colors';

.context-menu {
  position: absolute;
  padding: 0;
  background: $bg;
  border: 1px solid $light-gray;

  &-enter-active,
  &-leave-active {
    transition: all 0.1s;
  }

  &-enter,
  &-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    padding: 0.5rem;
    font-size: 0.9rem;
    color: #bfbfbf;
    cursor: pointer;
    border-bottom: 1px solid #6b6e70;

    &:hover {
      background: #272b2d;
    }

    &:last-child {
      border-bottom: none;
    }
  }
}
</style>
