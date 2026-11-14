<template>
  <div class="not-found u-widget u-flex-col" data-testid="not-found">
    <p class="not-found__code">404</p>

    <h1 class="u-page-title">Page not found</h1>

    <BaseButton class="not-found__go-home-btn" type="primary" @click="goHome">
      Go home
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '@common/BaseButton.vue';

const router = useRouter();

// Also shown in place by the post, profile and edit pages, whose routes carry another title
onMounted(() => {
  window.document.title = 'Not Found | Smiler';
});

const goHome = () => {
  router.push({
    name: 'Home',
  });
};
</script>

<style>
.not-found {
  align-items: center;

  &__code {
    margin: 0 0 0.25rem;
    color: var(--color-text-secondary);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
  }

  &__go-home-btn {
    width: 180px;
  }
}
</style>
