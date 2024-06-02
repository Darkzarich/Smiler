<template>
  <div class="upload">
    <label class="upload__input">
      <span>Upload image</span>
      <input
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
@import '@/styles/colors';
@import '@/styles/mixins';

.upload {
  @include flex-col;

  padding: 1rem;

  &__input {
    padding: 1rem;
    border: 2px solid $light-gray;
    border-radius: 3px;
    background: $bg;

    span {
      display: block;
      color: $main-text;
      text-align: center;
    }

    input[type='file' i] {
      position: absolute;
      opacity: 0;
      outline: 0;
      pointer-events: none;
      user-select: none;
    }
  }
}
</style>
