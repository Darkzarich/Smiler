<template>
  <ul class="current-user-navigation">
    <RouterLink
      class="current-user-navigation__item"
      data-testid="create-post-btn"
      :to="{
        name: 'PostCreate',
      }"
    >
      <IconAdd class="current-user-navigation__item-icon" /> New Post
    </RouterLink>

    <RouterLink
      class="current-user-navigation__item"
      :to="{
        name: 'UserSettings',
      }"
    >
      <IconSettings class="current-user-navigation__item-icon" /> Settings
    </RouterLink>

    <li
      class="current-user-navigation__item"
      data-testid="logout-btn"
      @click="logout()"
    >
      <IconExit class="current-user-navigation__item-icon" /> Logout
    </li>
  </ul>
</template>

<script>
import api from '@/api';
import IconAdd from '@icons/IconAdd.vue';
import IconExit from '@icons/IconExit.vue';
import IconSettings from '@icons/IconSettings.vue';

export default {
  components: {
    IconAdd,
    IconExit,
    IconSettings,
  },
  methods: {
    async logout() {
      const res = await api.auth.logout();

      if (!res.data.ok) {
        return;
      }

      this.$store.commit('clearUser');
    },
  },
};
</script>

<style lang="scss">
.current-user-navigation {
  margin-left: 0;
  text-align: center;
  padding-inline-start: 0;
  margin-block: 0 0;
  list-style: none;

  &__item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--color-light-gray);
    color: var(--color-main-text);
    text-decoration: none;
    cursor: pointer;
    font-weight: 500;
    line-height: 24px;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--color-bg);
    }
  }

  &__item-icon {
    width: 2rem;
    margin-right: 0.5rem;
    fill: var(--color-main-text);
  }
}
</style>
