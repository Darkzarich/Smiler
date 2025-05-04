<template>
  <div
    class="base-textarea"
    :class="error && isDirty ? 'base-textarea--error' : ''"
  >
    <label v-if="label" class="base-textarea__label" :for="id">
      {{ label }}
    </label>

    <textarea
      :id="id"
      v-model="modelValue"
      :data-testid="dataTestid"
      :disabled="disabled"
      :name="name"
      :placeholder="placeholder"
      class="base-textarea__textarea"
    />

    <span
      v-if="isDirty && error"
      :data-testid="`${dataTestid}-error`"
      class="base-textarea__error"
    >
      {{ error }}
    </span>
  </div>
</template>

<script>
export default {
  props: {
    id: {
      type: String,
      default: () => crypto.randomUUID(),
    },
    dataTestid: {
      type: String,
      default: 'input',
    },
    modelValue: {
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
    enterCallback: {
      type: Function,
      default: () => {},
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      isDirty: false,
    };
  },
  methods: {
    setValue(val) {
      this.$emit('update:modelValue', val);
      this.isDirty = true;
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.base-textarea {
  @include flex-col;

  &__label {
    margin-bottom: 4px;
    color: var(--color-main-text);
    font-size: 13px;
  }

  &__textarea {
    padding: 0.5rem;
    border: 1px solid var(--color-gray-light);
    border-radius: 8px;
    background: var(--color-bg);
    color: var(--color-main-text);
    transition: all 200ms ease-out;

    &:focus {
      outline: none;
      border: 1px solid var(--color-primary);
    }
  }

  &--error {
    .base-textarea {
      &__label {
        color: var(--color-danger);
      }

      &__textarea {
        border: 1px solid var(--color-danger);

        &:focus {
          outline-color: var(--color-danger);
        }
      }
    }
  }

  &__error {
    margin-top: 6px;
    color: var(--color-danger);
    font-size: 12px;
  }
}
</style>
