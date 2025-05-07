<template>
  <div class="base-upload-form">
    <label class="base-upload-form__label" :for="id">
      <span>Upload image</span>

      <input
        :id="id"
        class="base-upload-form__input"
        type="file"
        @input="handleInput"
        @change="handleInput"
      />
    </label>
  </div>
</template>

<script lang="ts" setup>
const file = defineModel<File>();

// TODO: Replace all randomUUID with nano or something
const id = crypto.randomUUID();

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;

  if (!target.files) {
    return;
  }

  file.value = target.files[0];
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
