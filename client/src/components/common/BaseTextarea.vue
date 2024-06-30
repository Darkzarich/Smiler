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
      :data-testid="dataTestid"
      :disabled="disabled"
      :name="name"
      :value="value"
      :placeholder="placeholder"
      class="base-textarea__textarea"
      @input="setValue($event.target.value)"
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
  data() {
    return {
      isDirty: false,
    };
  },
  methods: {
    setValue(val) {
      this.$emit('input', val);
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
    border: 1px solid var(--color-light-gray);
    border-radius: 2px;
    background: var(--color-bg);
    color: var(--color-main-text);

    &:focus {
      outline: none;
      border: 1px solid var(--color-primary);
    }
  }

  &--error {
    .base-textarea {
      &__label {
        color: var(--color-error);
      }

      &__textarea {
        border: 1px solid var(--color-error);

        &:focus {
          outline-color: var(--color-error);
        }
      }
    }
  }

  &__error {
    margin-top: 6px;
    color: var(--color-error);
    font-size: 12px;
  }
}
</style>
