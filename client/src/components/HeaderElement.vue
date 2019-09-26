<template>
<header class="header">
  <router-link :to="{ name: 'Home' }">
    Home
  </router-link>
</header>
</template>

<script>
export default {

}
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/colors.scss';

  .header {
    background-color: $widget-bg;
    height: $header-height;
    width: 100%;
    position: fixed;
    top: 0;
    z-index: 2;
    padding: 1rem;
  }
</style>
