<template>
  <div class="base-upload-form u-flex-col">
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

<script setup lang="ts">
const file = defineModel<File | null>();

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
@use '@/styles/mixins';

.base-upload-form {
  &__label {
    display: block;
    padding: 1rem;
    border: 2px solid var(--color-text-secondary);
    border-radius: 3px;
    background: var(--color-surface-primary);
    color: var(--color-text-primary);
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
