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

<script setup lang="ts">
import { api } from '@/api';
import { useUserStore } from '@/store/user';
import IconAdd from '@icons/IconAdd.vue';
import IconExit from '@icons/IconExit.vue';
import IconSettings from '@icons/IconSettings.vue';

const userStore = useUserStore();

const logout = async () => {
  try {
    await api.auth.logout();
  } finally {
    userStore.clearUser();
  }
};
</script>

<style lang="scss">
.current-user-navigation {
  margin-left: 0;
  text-align: center;
  padding-inline-start: 0;
  margin-block: 0;
  list-style: none;

  &__item-icon {
    width: 2rem;
    margin-right: 0.5rem;
    fill: var(--color-main-text);
    transition: all 200ms ease-out;
  }

  &__item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 1rem;
    border-left: 2px solid transparent;
    color: var(--color-main-text);
    text-decoration: none;
    cursor: pointer;
    font-weight: 500;
    line-height: 24px;
    transition: all 200ms ease-out;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      border-left: 2px solid var(--color-primary);
      color: var(--color-primary);

      .current-user-navigation__item-icon {
        fill: var(--color-primary);
      }
    }
  }
}
</style>
