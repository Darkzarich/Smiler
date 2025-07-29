<template>
  <div class="site-logo">
    <img src="@/assets/logo.png" class="site-logo__desktop" alt="Home" />
    <img
      src="@/assets/neutral_avatar.png"
      class="site-logo__mobile"
      alt="Home"
    />
  </div>
</template>

<style lang="scss">
@use '@/styles/mixins';

.site-logo {
  &__desktop {
    height: 100%;

    @include mixins.for-size(phone-only) {
      display: none;
    }
  }

  &__mobile {
    display: none;
    height: 100%;

    @include mixins.for-size(phone-only) {
      display: inline-block;
    }
  }
}
</style>
