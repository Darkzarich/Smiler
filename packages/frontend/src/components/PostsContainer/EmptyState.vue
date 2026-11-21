<template>
  <div class="empty-state">
    <p class="empty-state__title">{{ title }}</p>

    <p v-if="line" class="empty-state__line">{{ line }}</p>

    <div v-if="$slots.actions" class="empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  line?: string;
}>();
</script>

<style>
.empty-state {
  max-width: 34rem;

  &__title {
    margin: 0;
    font-size: 1.3rem;
    font-weight: 600;
    line-height: 1.7rem;
  }

  &__line {
    margin: 0.25rem 0 0;
    color: var(--color-text-secondary);
    font-size: 1rem;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 1rem;
  }
}
</style>
