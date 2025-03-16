<template>
  <nav>
    <slot name="before" />

    <NavigationLink
      v-for="link in links"
      :key="link.route.name"
      :class="navLinkClass"
      :to="link.route"
      :data-testid="link.dataTestId"
    >
      {{ link.label }}
    </NavigationLink>

    <slot name="after" />
  </nav>
</template>

<script>
import NavigationLink from './NavigationLink.vue';

export default {
  components: {
    NavigationLink,
  },
  props: {
    navLinkClass: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      links: Object.freeze([
        {
          label: 'TODAY',
          route: {
            name: 'Home',
          },
          // This field is used in tests to access this element
          dataTestId: 'today-link',
        },
        {
          label: 'ALL',
          route: {
            name: 'All',
          },
          dataTestId: 'all-link',
        },
        {
          label: 'BLOWING',
          route: {
            name: 'Blowing',
          },
          dataTestId: 'blowing-link',
        },
        {
          label: 'TOP THIS WEEK',
          route: {
            name: 'TopThisWeek',
          },
          dataTestId: 'top-this-week-link',
        },
        {
          label: 'NEW',
          route: {
            name: 'New',
          },
          dataTestId: 'new-link',
        },
      ]),
    };
  },
};
</script>
