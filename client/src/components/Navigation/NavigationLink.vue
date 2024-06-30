<template>
  <RouterLink
    class="nav-link"
    :class="{ 'nav-link--disabled': disabled }"
    :to="to"
  >
    <slot />
  </RouterLink>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    to: {
      type: Object,
      required: true,
      validator: (route) => Boolean(route.name),
    },
  },
};
</script>

<style lang="scss">
.nav-link {
  color: var(--color-main-text);
  text-decoration: none;
  font-weight: bold;

  &--disabled {
    color: var(--color-light-gray);
    user-select: none;
    pointer-events: none;
  }

  &.router-link-exact-active {
    color: var(--color-primary);
  }
}
</style>
