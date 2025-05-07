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
      :value="modelValue"
      :data-testid="dataTestid"
      :disabled="disabled"
      :name="name"
      :placeholder="placeholder"
      class="base-textarea__textarea"
      @input="setValue"
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

<script lang="ts" setup>
import { ref } from 'vue';

interface Props {
  dataTestid?: string;
  disabled?: boolean;
  label?: string;
  name?: string;
  placeholder?: string;
  error?: string;
  // TODO: Why callback?
  enterCallback?: () => void;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'input',
  disabled: false,
  label: '',
  name: '',
  placeholder: 'Enter any text',
  error: '',
  enterCallback: () => {},
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
