<template>
  <div class="base-input" :class="error && isDirty ? 'base-input--error' : ''">
    <label v-if="label" class="base-input__label" :for="id">
      {{ label }}
    </label>

    <input
      :id="id"
      v-model="modelValue"
      :data-testid="dataTestid"
      :disabled="disabled"
      :type="type"
      :name="name"
      :placeholder="placeholder"
      class="base-input__input"
      @keyup.enter="$emit('keyup:enter')"
    />

    <div v-if="icon" class="base-input__icon" @click="$emit('click-icon')">
      <Component :is="icon" />
    </div>

    <span
      v-if="isDirty && error"
      :data-testid="`${dataTestid}-error`"
      class="base-input__error"
    >
      {{ error }}
    </span>
  </div>
</template>

<script>
import IconSearch from '@icons/IconSearch.vue';

export default {
  components: {
    IconSearch,
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
    type: {
      type: String,
      default: 'text',
      validator(val) {
        return ['text', 'password'].indexOf(val) !== -1;
      },
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
    icon: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'keyup:enter', 'click-icon'],
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

.base-input {
  @include flex-col;

  // TODO: Width 100%?

  position: relative;

  &__label {
    margin-bottom: 4px;
    color: var(--color-main-text);
    font-size: 13px;
  }

  &__input {
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
    .base-input {
      &__label {
        color: var(--color-danger);
      }

      &__input {
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

  &__icon {
    display: flex;
    align-items: center;
    position: absolute;
    top: 6px;
    right: 7px;

    svg {
      fill: var(--color-gray-light);
      cursor: pointer;
    }
  }
}
</style>
