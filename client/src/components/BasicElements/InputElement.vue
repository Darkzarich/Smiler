<template>
  <div class="input">
    <label v-if="label" for="label">
      {{ label }}
    </label>
    <input
      :id="label"
      :disabled="disabled"
      :type="type"
      v-if="!multiline"
      :name="name"
      @input="setValueAndChanged($event.target.value)"
      @keyup.enter="enterCallback"
      :value="value"
      :placeholder="placeHolder"
      class="input__element"
      :class="(error || errorOnlyStyle) && wasChanged ? 'input__element_error' : ''"
    />
    <div @click="iconClickCallback" class="input__icon">
      <component v-if="icon" :is="icon" />
    </div>
    <textarea
      :id="label"
      :disabled="disabled"
      v-if="multiline"
      :type="type"
      :name="name"
      @input="setValueAndChanged($event.target.value)"
      :value="value"
      :placeholder="placeHolder"
      class="input__element"
      :class="(error || errorOnlyStyle) && wasChanged ? 'input__element_error' : ''"
    />
    <span
      class="input__error"
      v-if="wasChanged"
    >
      {{ error }}
    </span>
  </div>
</template>

<script>
import searchIcon from '@/library/svg/search';

export default {
  data() {
    return {
      wasChanged: false,
    };
  },
  components: {
    searchIcon,
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'text',
      validator(val) {
        return ['text', 'password'].indexOf(val) !== -1;
      },
    },
    multiline: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: '',
    },
    placeHolder: {
      type: String,
      default: 'Enter any text',
    },
    error: {
      type: String,
      default: '',
    },
    errorOnlyStyle: {
      type: Boolean,
    },
    enterCallback: {
      type: Function,
      default: () => {},
    },
    icon: {
      type: String,
      default: '',
    },
    iconClickCallback: {
      type: Function,
      default: () => {},
    },
  },
  methods: {
    setValueAndChanged(val) {
      this.$emit('input', val);
      this.wasChanged = true;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.input {
  @include flex-col;
  margin-left: 1rem;
  margin-right: 1rem;

  &__error {
    color: $error;
    font-size: 0.7rem;
  }

  &__icon {
    display: flex;
    align-items: center;
    position: relative;
    left: -2rem;
    svg {
      fill: $light-gray;
      cursor: pointer;
    }
  }

  &__element {
    background: $bg;
    padding: 0.5rem;
    margin-top: 0.5rem;
    width: 95%;
    margin-bottom: 0.5rem;
    color: $main-text;
    border: 1px solid $light-gray;
    border-radius: 2px;
    &:focus {
      outline-color: $firm;
    }
    &_error {
      border: 1px solid $error;
    }
  }
}

</style>
