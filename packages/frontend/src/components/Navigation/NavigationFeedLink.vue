<template>
  <NavigationLink
    :title="isUserAuth ? '' : 'Sign in to access this page'"
    :to="{ name: 'Feed' }"
    data-testid="feed-link"
    :disabled="!isUserAuth"
  >
    MY FEED
  </NavigationLink>
</template>

<script>
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import NavigationLink from './NavigationLink.vue';

export default defineComponent({
  components: {
    NavigationLink,
  },
  computed: {
    ...mapGetters(['isUserAuth']),
  },
});
</script>
