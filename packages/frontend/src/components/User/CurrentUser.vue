<template>
  <div class="current-user">
    <AuthFormSwitcher v-if="!user" />

    <template v-else>
      <div class="current-user__main">
        <div class="current-user__avatar-container">
          <RouterLink
            class="current-user__profile-link"
            :to="{
              name: 'UserPage',
              params: {
                login: user.login,
              },
            }"
          >
            <img
              class="current-user__avatar"
              :src="resolveAvatar(user.avatar)"
              :alt="user.avatar"
            />

            <div class="current-user__login" data-testid="user-login">
              {{ user.login }}
            </div>
          </RouterLink>
        </div>

        <UserStats :user="user" class="current-user__stats" />

        <CurrentUserNavigation />
      </div>
    </template>
  </div>
</template>

<script>
import { mapState } from 'pinia';
import { defineComponent } from 'vue';
import AuthFormSwitcher from '../AuthForm/AuthFormSwitcher.vue';
import CurrentUserNavigation from './CurrentUserNavigation.vue';
import { useUserStore } from '@/store/user';
import { resolveAvatar } from '@/utils/resolve-avatar';
import UserStats from '@components/User/UserStats.vue';

export default defineComponent({
  components: {
    AuthFormSwitcher,
    UserStats,
    CurrentUserNavigation,
  },
  computed: {
    ...mapState(useUserStore, ['user']),
  },
  methods: {
    resolveAvatar,
  },
});
</script>

<style lang="scss">
@use '@/styles/mixins';

.current-user {
  @include mixins.widget;

  padding: 0;

  &__avatar-container {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    width: 100%;
    margin: 0 auto;
    padding: 1rem;
    background: var(--color-header);
    user-select: none;

    @include mixins.for-size(phone-only) {
      padding: 0.5rem;
    }
  }

  &__profile-link {
    text-decoration: none;
  }

  &__avatar {
    width: 8rem;
    border-radius: 50%;
  }

  &__login {
    margin: 1rem;
    color: var(--color-main-text);
    text-align: center;
    font-size: 1rem;

    @include mixins.for-size(phone-only) {
      margin: 0.5rem;
    }
  }

  &__stats {
    flex-flow: row nowrap;
    justify-content: center;
    padding: 1rem;
  }
}
</style>
