<template>
  <div class="base-segmented-control" role="group" :aria-label="label">
    <BaseButton
      v-for="option in options"
      :key="option.value"
      size="medium"
      :data-testid="option.dataTestid"
      :active="option.value === model"
      :aria-pressed="option.value === model"
      @click="model = option.value"
    >
      {{ option.label }}
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import BaseButton from './BaseButton.vue';

interface Option {
  value: string;
  label: string;
  dataTestid?: string;
}

interface Props {
  options: Option[];
  label: string;
}

defineProps<Props>();

const model = defineModel<string>({ required: true });
</script>

<style>
.base-segmented-control {
  display: flex;
  width: fit-content;

  .base-button {
    border-radius: 0;

    &:first-child {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    &:last-child {
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }

    /* Collapses the two 2px borders between segments into one */
    &:not(:first-child) {
      margin-left: -2px;
    }
  }
}
</style>
