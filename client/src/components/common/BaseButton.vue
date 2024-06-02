<template>
  <!-- TODO: refactor: make <button> root element 
    then I won't need :callback prop -->
  <div class="button" :class="loading ? 'button_loading' : ''">
    <button
      :data-testid="dataTestid"
      type="button"
      class="button__element"
      :disabled="disabled"
      @click="callback(argument)"
    >
      <span class="button__element-content">
        <slot />
      </span>
      <div v-if="loading" class="button__element-loader">
        <CircularLoader />
      </div>
    </button>
  </div>
</template>

<script>
import CircularLoader from '@icons/animation/CircularLoader.vue';

export default {
  components: {
    CircularLoader,
  },
  props: {
    dataTestid: {
      type: String,
      default: 'button',
    },
    callback: {
      type: Function,
      default: () => {},
    },
    argument: {
      type: String,
      default: '',
    },
    disabled: {
      type: [Boolean, String],
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.button {
  justify-content: center;

  // TODO: basic components must not have this style
  margin: 1rem;

  @include flex-row;

  &__element {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 0.5rem;
    outline: none;
    border: 2px solid $firm;
    border-radius: 2px;
    background: $bg;
    color: $firm;
    font-weight: bold;
    cursor: pointer;

    &:hover {
      background: $widget-bg;
    }

    &[disabled] {
      border: 2px solid $light-gray;
      color: $light-gray;
      pointer-events: none;
    }
  }

  &__element-loader {
    position: absolute;

    svg {
      width: 1rem;
      height: 1rem;
    }
  }

  &_loading {
    pointer-events: none;

    .button {
      &__element {
        border: 2px solid rgba($firm, 0.5);
      }

      &__element-content {
        opacity: 0.5;
        user-select: none;
      }
    }
  }
}
</style>
