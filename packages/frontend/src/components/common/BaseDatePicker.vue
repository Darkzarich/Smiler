<template>
  <div class="base-date-picker">
    <label v-if="label" class="base-date-picker__label" :for="inputId">
      {{ label }}
    </label>

    <input
      :id="inputId"
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

const inputId = crypto.randomUUID();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;

  date.value = target.value;
};
</script>

<style scoped>
.base-date-picker {
  &__label {
    display: inline-block;
    min-width: 80px;
    color: var(--color-text-secondary);
  }

  &__input {
    width: 135px;
    padding: 8px;
    border: 1px solid var(--color-text-secondary);
    background: var(--color-surface-primary);
    color: var(--color-text-primary);

    &::-webkit-inner-spin-button {
      display: none;
    }
  }
}
</style>
