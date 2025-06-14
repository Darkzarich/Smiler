<template>
  <div class="base-input" :class="error && isDirty ? 'base-input--error' : ''">
    <label v-if="label" class="base-input__label" :for="id">
      {{ label }}
    </label>

    <input
      :id="id"
      :value="modelValue"
      :data-testid="dataTestid"
      :disabled="disabled"
      :type="type"
      :name="name"
      :placeholder="placeholder"
      class="base-input__input"
      @input="setValue"
      @keyup.enter="$emit('keyup.enter')"
    />

    <div v-if="$slots.iconRight" class="base-input__icon">
      <slot name="icon-right" />
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

<script setup lang="ts">
import { ref } from 'vue';

interface Emit {
  'keyup.enter': [];
}

defineEmits<Emit>();

interface Props {
  dataTestid?: string;
  disabled?: boolean;
  label?: string;
  type?: 'text' | 'password';
  name?: string;
  placeholder?: string;
  error?: string;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
  disabled: false,
  label: '',
  type: 'text',
  name: '',
  placeholder: 'Enter any text',
  error: '',
});

const textAreaValue = defineModel<string>({
  default: '',
});

const id = crypto.randomUUID();

const isDirty = ref(false);

const setValue = (event: Event) => {
  const target = event.target as HTMLInputElement;

  textAreaValue.value = target.value;
  isDirty.value = true;
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.base-input {
  @include mixins.flex-col;

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
