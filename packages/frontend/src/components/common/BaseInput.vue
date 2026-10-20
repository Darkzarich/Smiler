<template>
  <div
    class="base-input u-flex-col"
    :class="{
      'base-input--error': error && isErrorShown,
      'base-input--with-icon': $slots['icon-right'],
    }"
  >
    <label v-if="label" class="base-input__label" :for="id">
      {{ label }}
    </label>

    <input
      :id="id"
      ref="input"
      :value="modelValue"
      :data-testid="dataTestid"
      :disabled="disabled"
      :type="type"
      :name="name"
      :placeholder="placeholder"
      class="base-input__input"
      :aria-invalid="Boolean(error && isErrorShown)"
      :aria-describedby="error && isErrorShown ? `${id}-error` : undefined"
      @input="setValue"
      @keyup.enter="$emit('keyup.enter')"
    />

    <div v-if="$slots['icon-right']" class="base-input__icon">
      <slot name="icon-right" />
    </div>

    <span
      v-if="isErrorShown && error"
      :id="`${id}-error`"
      :data-testid="`${dataTestid}-error`"
      class="base-input__error"
    >
      {{ error }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';

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
  /** Shows the error before the field is typed in, e.g. once its form was submitted */
  showError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
  disabled: false,
  label: '',
  type: 'text',
  name: '',
  placeholder: 'Enter any text',
  error: '',
  showError: false,
});

const textAreaValue = defineModel<string>({
  default: '',
});

const id = crypto.randomUUID();

const isDirty = ref(false);

const isErrorShown = computed(() => isDirty.value || props.showError);

const input = useTemplateRef<HTMLInputElement>('input');

defineExpose({
  focus: () => input.value?.focus(),
});

const setValue = (event: Event) => {
  const target = event.target as HTMLInputElement;

  textAreaValue.value = target.value;
  isDirty.value = true;
};
</script>

<style>
.base-input {
  /* TODO: Width 100%? */

  position: relative;

  &__label {
    margin-bottom: 4px;
    color: var(--color-text-primary);
    font-size: 13px;
  }

  &__input {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface-primary);
    color: var(--color-text-primary);
    transition: all 200ms ease-out;

    &:focus {
      outline: none;
      border: 1px solid var(--color-primary-strong);
    }
  }

  &--with-icon &__input {
    padding-right: 2.25rem;
  }

  &--error {
    .base-input {
      &__label {
        color: var(--color-danger-strong);
      }

      &__input {
        border: 1px solid var(--color-danger-strong);

        &:focus {
          outline-color: var(--color-danger-strong);
        }
      }
    }
  }

  &__error {
    margin-top: 6px;
    color: var(--color-danger-strong);
    font-size: 12px;
  }

  /* Sized for a small BaseIconButton (28px), centered in the 36px field */
  &__icon {
    display: flex;
    align-items: center;
    position: absolute;
    top: 4px;
    right: 4px;
  }
}
</style>
