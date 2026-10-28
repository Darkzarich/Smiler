<template>
  <div class="not-found u-widget u-flex-col">
    <p class="not-found__code">404</p>

    <h1 class="u-page-title">Page not found</h1>

    <BaseButton class="not-found__go-home-btn" type="primary" @click="goHome">
      Go home
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import BaseButton from '@common/BaseButton.vue';

const router = useRouter();

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
