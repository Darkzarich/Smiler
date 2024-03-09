<template>
  <div class="input" :class="(error || errorOnlyStyle) && wasChanged ? 'input--error' : ''">
    <label v-if="label" class="input__label" for="label">
      {{ label }}
    </label>

    <input
      v-if="!multiline"
      :id="id"
      :data-testid="dataTestid"
      :disabled="disabled"
      :type="type"
      :name="name"
      :value="value"
      :placeholder="placeholder"
      class="input__element"
      @input="setValueAndChanged($event.target.value)"
      @keyup.enter="enterCallback"
    />

    <div class="input__icon" @click="iconClickCallback">
      <Component :is="icon" v-if="icon" />
    </div>

    <textarea
      v-if="multiline"
      :id="id"
      :data-testid="dataTestid"
      :disabled="disabled"
      :type="type"
      :name="name"
      :value="value"
      :placeholder="placeholder"
      class="input__element"
      @input="setValueAndChanged($event.target.value)"
    />

    <span
      v-if="wasChanged"
      :data-testid="`${dataTestid}-error`"
      class="input__error"
    >
      {{ error }}
    </span>
  </div>
</template>

<script>
import SearchIcon from '@/library/svg/SearchIcon.vue';

export default {
  components: {
    SearchIcon,
  },
  props: {
    id: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    dataTestid: {
      type: String,
      default: 'input',
    },
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
    placeholder: {
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
  data() {
    return {
      wasChanged: false,
    };
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

  &--error {

    .input__label {
      color: $error;
    }

    .input__element {
      border: 1px solid $error;
    }

    .input__element:focus {
      outline-color: $error;
    }
  }

  &__label {
    color: $main-text;
    font-size: 13px;
    margin-bottom: -4px;
  }

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
  }
}

</style>
