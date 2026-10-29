<template>
  <ul class="current-user-navigation">
    <li>
      <RouterLink
        class="current-user-navigation__item"
        data-testid="create-post-btn"
        :to="{
          name: 'PostCreate',
        }"
      >
        <IconAdd class="current-user-navigation__item-icon" /> New Post
      </RouterLink>
    </li>

    <li>
      <RouterLink
        class="current-user-navigation__item"
        :to="{
          name: 'UserSettings',
        }"
      >
        <IconSettings class="current-user-navigation__item-icon" /> Settings
      </RouterLink>
    </li>

    <li>
      <button
        type="button"
        class="current-user-navigation__item"
        data-testid="logout-btn"
        @click="logout()"
      >
        <IconExit class="current-user-navigation__item-icon" /> Logout
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { api } from '@/api';
import { useUserStore } from '@/store/user';
import IconAdd from '@icons/IconAdd.vue';
import IconExit from '@icons/IconExit.vue';
import IconSettings from '@icons/IconSettings.vue';

const router = useRouter();

const userStore = useUserStore();

const logout = async () => {
  try {
    await api.auth.logout();
  } catch {
    // The API client already told the user why; the session is still alive on
    // the server, so the app must keep showing them as signed in
    return;
  }

  userStore.clearUser();

  router.push({ name: 'Home' });
};
</script>

<style>
.current-user-navigation {
  margin: 0;
  padding: 0;
  list-style: none;

  &__item-icon {
    flex: none;
    width: 20px;
    height: 20px;
    margin-right: 12px;
    fill: var(--color-text-primary);
    transition: all 200ms ease-out;
  }

  &__item {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding: 1rem;
    border: none;
    border-left: 2px solid transparent;
    background: none;
    color: var(--color-text-primary);
    text-decoration: none;
    font: inherit;
    cursor: pointer;
    font-weight: 500;
    line-height: 24px;
    transition: all 200ms ease-out;

    @media (--hover) {
      &:hover {
        border-left: 2px solid var(--color-primary-strong);
        color: var(--color-primary-strong);

        .current-user-navigation__item-icon {
          fill: var(--color-primary-strong);
        }
      }
    }
  }
}
</style>
