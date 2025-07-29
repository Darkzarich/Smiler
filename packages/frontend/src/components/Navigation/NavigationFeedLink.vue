<template>
  <NavigationLink
    :title="isAuth ? '' : 'Sign in to access this page'"
    :to="{ name: 'Feed' }"
    data-testid="feed-link"
    :disabled="!isAuth"
  >
    MY FEED
  </NavigationLink>
</template>

<script setup lang="ts">
import NavigationLink from './NavigationLink.vue';

interface Props {
  isAuth?: boolean;
}

withDefaults(defineProps<Props>(), {
  isAuth: false,
});
</script>
