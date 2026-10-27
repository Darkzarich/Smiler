<template>
  <div class="base-slider">
    <label v-if="label" class="base-slider__label" :for="inputId">
      {{ label }}
    </label>

    <input
      :id="inputId"
      :value="modelValue"
      class="base-slider__input"
      :style="{ '--slider-fill': fill }"
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
import { computed } from 'vue';

interface Props {
  dataTestid?: string;
  label?: string;
  min?: number;
  max?: number;
}

const props = withDefaults(defineProps<Props>(), {
  dataTestid: 'slider',
  label: 'Slider',
  min: -2000,
  max: 9999,
});

const inputId = crypto.randomUUID();

const sliderValue = defineModel<number | null>({
  default: 0,
});

// How far the track is filled, up to the thumb. Without a value the browser puts the thumb in the
// middle, so the fill starts there too.
const fill = computed(() => {
  const value = sliderValue.value ?? (props.min + props.max) / 2;

  return `${((value - props.min) / (props.max - props.min)) * 100}%`;
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;

  sliderValue.value = Number(target.value);
};
</script>

<style scoped>
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
    --slider-track: linear-gradient(
      to right,
      var(--color-primary) var(--slider-fill),
      var(--color-border-hover) var(--slider-fill)
    );
    --slider-thumb: 18px;

    margin: 0 8px;
    border-radius: 4px;
    background: transparent;
    appearance: none;

    @media (--pointer-coarse) {
      --slider-thumb: 24px;

      height: 44px;
    }

    /* A ring on the card color: the thumb reads as a knob on the green fill and on the grey */
    &::-webkit-slider-thumb {
      width: var(--slider-thumb);
      height: var(--slider-thumb);
      margin-top: calc((6px - var(--slider-thumb)) / 2);
      border: 2px solid var(--color-primary-strong);
      border-radius: 50%;
      box-shadow: 0 1px 3px rgb(0 0 0 / 25%);
      background: var(--color-surface-secondary);
      cursor: pointer;
      appearance: none;
    }

    &::-moz-range-thumb {
      width: var(--slider-thumb);
      height: var(--slider-thumb);
      border: 2px solid var(--color-primary-strong);
      border-radius: 50%;
      box-shadow: 0 1px 3px rgb(0 0 0 / 25%);
      background: var(--color-surface-secondary);
      box-sizing: border-box;
      cursor: pointer;
    }

    &::-webkit-slider-runnable-track {
      height: 6px;
      border-radius: 3px;
      background: var(--slider-track);
      cursor: pointer;
    }

    &::-moz-range-track {
      height: 6px;
      border-radius: 3px;
      background: var(--slider-track);
      cursor: pointer;
    }
  }
}
</style>
