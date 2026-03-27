<template>
  <div class="not-found u-widget u-flex-col">
    <div class="not-found__404">404</div>

    <div class="not-found__info">Not existing page</div>

    <BaseButton class="not-found__go-home-btn" @click="goHome">
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

<style lang="scss">
@use '@/styles/mixins';

.not-found {
  align-items: center;

  &__404 {
    color: var(--color-text-primary);
    font-size: 48px;
    font-weight: bold;
  }

  &__info {
    margin-bottom: 1rem;
    color: var(--color-text-primary);
    font-size: 48px;

    @include mixins.for-size(phone-only) {
      font-size: 32px;
    }
  }

  &__go-home-btn {
    width: 180px;
  }
}
</style>
