<template>
  <div class="slider">
    <label :for="label">
      {{ label }}
    </label>
    <input
      :id="label"
      :data-testid="dataTestid"
      type="range"
      :max="max"
      :min="min"
      step="1"
      :value="value"
      @input="$emit('input', $event.target.value)"
    />
    <span class="slider__val">
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
@import '@/styles/colors';
@import '@/styles/mixins';

.slider {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;

  &__val {
    position: absolute;
    color: $main-text;
  }

  input[type='range'] {
    color: $main-text;
    background: $bg;
    outline: $firm;
    border: 1px solid $light-gray;
    appearance: none;

    &::-webkit-slider-thumb {
      height: 1rem;
      width: 1rem;
      border-radius: 12px;
      background: $firm;
      cursor: pointer;
      appearance: none;
      margin-top: -0.3rem;
    }

    &::-webkit-slider-runnable-track {
      background: $light-gray;
      height: 0.5rem;
      cursor: pointer;
      border: none;
      border-radius: 5px;
    }
  }

  label {
    min-width: 85px;
    display: inline-block;
    color: $light-gray;
  }
}
</style>
