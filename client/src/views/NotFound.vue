<template>
  <div class="not-found">
    <div class="not-found__404">404</div>
    <div class="not-found__info">Not found</div>
    <div class="not-found__button-container">
      <ButtonElement :callback="goBack"> Go back </ButtonElement>
    </div>
  </div>
</template>

<script>
import ButtonElement from '@/components/BasicElements/ButtonElement.vue';

export default {
  components: {
    ButtonElement,
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
    color: $main-text;
    font-weight: bold;
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  &__info {
    color: $main-text;
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  &__button-container {
    width: 50%;
  }
}
</style>
