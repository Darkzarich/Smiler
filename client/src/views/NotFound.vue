<template>
  <div class="not-found">
    <div class="not-found__404">404</div>

    <div class="not-found__info">Not existing page</div>

    <BaseButton class="not-found__go-home-btn" @click.native="goHome">
      Go home
    </BaseButton>
  </div>
</template>

<script>
import BaseButton from '@common/BaseButton.vue';

export default {
  components: {
    BaseButton,
  },
  methods: {
    goHome() {
      this.$router.push({
        name: 'Home',
      });
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
    font-size: 48px;
    font-weight: bold;
  }

  &__info {
    margin-bottom: 1rem;
    color: $main-text;
    font-size: 48px;

    @include for-size(phone-only) {
      font-size: 32px;
    }
  }

  &__go-home-btn {
    width: 180px;
  }
}
</style>
