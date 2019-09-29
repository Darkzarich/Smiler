<template>
<div class="input">
  <label v-if="label" for="label">
    {{ label }}
  </label>
  <input
    :id="label"
    :type="type"
    v-if="!multiline"
    :name="name"
    @input="setValueAndChanged($event.target.value)"
    :value="value"
    :placeholder="placeHolder"
    class="input__element"
    :class="(error || errorOnlyStyle) && wasChanged ? 'input__element_error' : ''"
  >
  <textarea
    :id="label"
    v-else
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
export default {
  data() {
    return {
      wasChanged: false,
    };
  },
  props: {
    value: {
      type: String,
    },
    label: {
      type: String,
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
    },
    errorOnlyStyle: {
      type: Boolean,
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
