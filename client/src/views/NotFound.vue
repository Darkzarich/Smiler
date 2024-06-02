<template>
  <div class="not-found">
    <div class="not-found__404">404</div>
    <div class="not-found__info">Not found</div>
    <div class="not-found__button-container">
      <BaseButton :callback="goBack"> Go back </BaseButton>
    </div>
  </div>
</template>

<script>
import BaseButton from '@common/BaseButton.vue';

export default {
  components: {
    BaseButton,
  },
  methods: {
    goBack() {
      this.$router.go(-2);
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.not-found {
  @include widget;
  @include flex-col;

  align-items: center;

  &__404 {
    margin-bottom: 1rem;
    color: $main-text;
    font-size: 4rem;
    font-weight: bold;
  }

  &__info {
    margin-bottom: 1rem;
    color: $main-text;
    font-size: 3rem;
  }

  &__button-container {
    width: 50%;
  }
}
</style>
