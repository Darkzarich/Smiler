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

<script>
import { defineComponent } from 'vue';
import NavigationLink from './NavigationLink.vue';

export default defineComponent({
  components: {
    NavigationLink,
  },
  props: {
    isAuth: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
