<template>
  <NavigationLink :to="{ name: 'Feed' }" data-testid="feed-link">
    My feed
  </NavigationLink>
</template>

<script setup lang="ts">
import NavigationLink from './NavigationLink.vue';
</script>
