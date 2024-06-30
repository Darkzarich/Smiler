<template>
  <div class="base-slider">
    <label class="base-slider__label" :for="label">
      {{ label }}
    </label>

    <input
      :id="label"
      class="base-slider__input"
      :data-testid="dataTestid"
      type="range"
      :max="max"
      :min="min"
      step="1"
      :value="value"
      @input="$emit('input', $event.target.value)"
    />

    <span class="base-slider__value">
      {{ value }}
    </span>
  </div>
</template>

<script>
export default {
  props: {
    dataTestid: {
      type: String,
      default: 'slider',
    },
    value: {
      type: String,
      default: '0',
    },
    label: {
      type: String,
      default: 'Slider',
    },
    min: {
      type: Number,
      default: -2000,
    },
    max: {
      type: Number,
      default: 9999,
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/mixins';

.base-slider {
  &__label {
    display: inline-block;
    min-width: 85px;
    color: var(--color-light-gray);
  }

  &__value {
    position: absolute;
    color: var(--color-main-text);
  }

  &__input {
    margin: 0 8px;
    outline: var(--color-primary);
    border: 1px solid var(--color-light-gray);
    border-radius: 5px;
    background: var(--color-bg);
    color: var(--color-main-text);
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
      background: var(--color-light-gray);
      cursor: pointer;
    }
  }
}
</style>
