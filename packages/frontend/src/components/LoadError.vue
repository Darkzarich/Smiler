<template>
  <div class="load-error u-widget u-flex-col" data-testid="load-error">
    <h1 class="u-page-title">{{ title }}</h1>

    <p class="load-error__text">
      Something went wrong on our side or with the connection. Please try again
      in a moment.
    </p>

    <BaseButton
      class="load-error__retry-btn"
      data-testid="load-error-retry"
      type="primary"
      :loading="loading"
      @click="emit('retry')"
    >
      Try again
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '@common/BaseButton.vue';

defineProps<{
  title: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  retry: [];
}>();
</script>

<style>
.load-error {
  align-items: center;
  text-align: center;

  &__text {
    margin: 0 0 1rem;
    color: var(--color-text-secondary);
  }

  &__retry-btn {
    width: 180px;
  }
}
</style>
