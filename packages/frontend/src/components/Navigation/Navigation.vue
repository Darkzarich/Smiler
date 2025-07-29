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

<script setup lang="ts">
import NavigationLink from './NavigationLink.vue';

interface NavLink {
  label: string;
  route: {
    name: string;
  };
  dataTestId: string;
}

interface Props {
  navLinkClass?: string;
}

withDefaults(defineProps<Props>(), {
  navLinkClass: '',
});

const links: readonly NavLink[] = Object.freeze([
  {
    label: 'TODAY',
    route: {
      name: 'Home',
    },
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
]);
</script>
