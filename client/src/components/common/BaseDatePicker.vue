<template>
  <div class="date-picker">
    <label :for="label">
      {{ label }}
    </label>
    <input
      :id="label"
      :data-testid="dataTestid"
      type="date"
      :value="value"
      @input="$emit('input', $event.target.value)"
    />
  </div>
</template>

<script>
export default {
  props: {
    dataTestid: {
      type: String,
      default: 'datepicker',
    },
    value: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/colors';
@import '@/styles/mixins';

.date-picker {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;

  input[type='date'] {
    padding: 0.5rem;
    outline: $firm;
    border: 1px solid $light-gray;
    background: $bg;
    color: $main-text;

    &::-webkit-inner-spin-button {
      display: none;
    }

    &::-webkit-calendar-picker-indicator {
      background: transparent;
    }
  }

  label {
    display: inline-block;
    min-width: 80px;
    color: $light-gray;
  }
}
</style>
