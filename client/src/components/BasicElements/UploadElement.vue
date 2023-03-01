<template>
  <div class="upload">
    <label class="upload__input">
      <span>Upload image</span>
      <input
        type="file"
        @input="handleInput($event.target.files[0])"
        @change="handleInput($event.target.files[0])"
      >
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
  @include flex-col();
  padding: 1rem;
  &__input {
    border: 2px solid $light-gray;
    padding: 1rem;
    border-radius: 3px;
    background: $bg;

    span {
      color: $main-text;
      display: block;
      text-align: center;
    }

    input[type="file" i] {
      outline:0;
      opacity:0;
      pointer-events:none;
      position: absolute;
      user-select: none;
    }
  }
}
</style>
