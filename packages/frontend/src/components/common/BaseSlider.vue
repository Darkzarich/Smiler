<template>
  <div class="base-slider">
    <label v-if="label" class="base-slider__label" :for="inputId">
      {{ label }}
    </label>

    <input
      :id="inputId"
      :value="modelValue"
      class="base-slider__input"
      :data-testid="dataTestid"
      type="range"
      :max="max"
      :min="min"
      step="1"
      @input="handleInput"
    />

    <span class="base-slider__value">
      {{ modelValue }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  dataTestid?: string;
  label?: string;
  min?: number;
  max?: number;
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'slider',
  label: 'Slider',
  min: -2000,
  max: 9999,
});

const inputId = crypto.randomUUID();

const sliderValue = defineModel<number | null>({
  default: 0,
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;

  sliderValue.value = Number(target.value);
};
</script>

<style lang="scss" scoped>
@use '@/styles/mixins';

.base-slider {
  &__label {
    display: inline-block;
    min-width: 85px;
    color: var(--color-text-secondary);
  }

  &__value {
    position: absolute;
    color: var(--color-text-primary);
  }

  &__input {
    margin: 0 8px;
    outline: var(--color-primary);
    border: 1px solid var(--color-text-secondary);
    border-radius: 5px;
    background: var(--color-surface-primary);
    color: var(--color-text-primary);
    appearance: none;

    &::-webkit-slider-thumb {
      width: 16px;
      height: 16px;
      margin-top: -4px;
      border-radius: 12px;
      background: var(--color-primary);
      cursor: pointer;
      appearance: none;
    }

    &::-webkit-slider-runnable-track {
      height: 0.5rem;
      border: none;
      border-radius: 5px;
      background: var(--color-text-secondary);
      cursor: pointer;
    }
  }
}
</style>
