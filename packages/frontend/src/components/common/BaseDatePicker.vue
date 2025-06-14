<template>
  <div class="base-date-picker">
    <label class="base-date-picker__label" :for="label">
      {{ label }}
    </label>

    <input
      :id="label"
      :value="modelValue"
      class="base-date-picker__input"
      :data-testid="dataTestid"
      type="date"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  dataTestid?: string;
  label?: string;
}

const date = defineModel<string>({
  default: '',
});

withDefaults(defineProps<Props>(), {
  dataTestid: 'datepicker',
  label: '',
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;

  date.value = target.value;
};
</script>

<style lang="scss" scoped>
@use '@/styles/mixins';

.base-date-picker {
  &__label {
    display: inline-block;
    min-width: 80px;
    color: var(--color-gray-light);
  }

  &__input {
    width: 135px;
    padding: 8px;
    outline: var(--color-primary);
    border: 1px solid var(--color-gray-light);
    background: var(--color-bg);
    color: var(--color-main-text);
    color-scheme: dark;

    &::-webkit-inner-spin-button {
      display: none;
    }

    &::-webkit-calendar-picker-indicator {
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" viewBox="0 0 24 24"><path fill="%23bbbbbb" d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>');
    }
  }
}
</style>
