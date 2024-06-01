<template>
  <NavigationLink
    :title="isUserAuth ? '' : 'Log in to access this page'"
    :to="{ name: 'Feed' }"
    data-testid="feed-link"
    :disabled="!isUserAuth"
  >
    MY FEED
  </NavigationLink>
</template>

<script>
import { mapGetters } from 'vuex';
import NavigationLink from './NavigationLink.vue';

export default {
  components: {
    NavigationLink,
  },
  computed: {
    ...mapGetters(['isUserAuth']),
  },
};
</script>
