<template>
  <NavigationLink :to="{ name: 'Feed' }" data-testid="feed-link">
    MY FEED
  </NavigationLink>
</template>

<script setup lang="ts">
import NavigationLink from './NavigationLink.vue';
</script>
