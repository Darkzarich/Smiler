<template>
  <div class="base-upload-form">
    <label class="base-upload-form__label">
      <span>Upload image</span>

      <input
        class="base-upload-form__input"
        type="file"
        @input="handleInput($event.target.files[0])"
        @change="handleInput($event.target.files[0])"
      />
    </label>
  </div>
</template>

<script>
export default {
  props: ['value'],
  methods: {
    handleInput(val) {
      console.log(val);
      this.$emit('input', val);
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.base-upload-form {
  @include flex-col;

  &__label {
    display: block;
    padding: 1rem;
    border: 2px solid var(--color-gray-light);
    border-radius: 3px;
    background: var(--color-bg);
    color: var(--color-main-text);
    text-align: center;
  }

  &__input {
    position: absolute;
    opacity: 0;
    outline: 0;
    pointer-events: none;
    user-select: none;
  }
}
</style>
