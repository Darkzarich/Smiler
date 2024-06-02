<template>
  <div class="current-user">
    <template v-if="!isUserAuth">
      <template v-if="mode == USER_LOGIN_MODE">
        <SignInForm @mode-change="setMode(USER_REG_MODE)" />
      </template>
      <template v-else-if="mode == USER_REG_MODE">
        <SignUpForm @mode-change="setMode(USER_LOGIN_MODE)" />
      </template>
    </template>

    <template v-else>
      <div class="current-user__logged-block">
        <div class="current-user__logged-meta">
          <div class="current-user__logged-meta-avatar">
            <RouterLink
              :to="{
                name: 'UserPage',
                params: {
                  login: user.login,
                },
              }"
            >
              <img :src="$resolveAvatar(user.avatar)" :alt="user.avatar" />
              <div
                class="current-user__logged-meta-login"
                data-testid="user-login"
              >
                {{ user.login }}
              </div>
            </RouterLink>
          </div>
        </div>

        <UserStats :user="user" class="current-user__stats" />

        <div class="current-user__logged-nav">
          <ul class="current-user__logged-nav-list">
            <RouterLink
              class="current-user__logged-nav-item"
              data-testid="create-post-btn"
              :to="{
                name: 'PostCreate',
              }"
            >
              <IconAdd /> New Post
            </RouterLink>
            <RouterLink
              class="current-user__logged-nav-item"
              :to="{
                name: 'UserSettings',
              }"
            >
              <IconSettings /> Settings
            </RouterLink>
            <li
              class="current-user__logged-nav-item"
              data-testid="logout-btn"
              @click="logout"
            >
              <IconExit /> Logout
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import api from '@/api';
import consts from '@/const/const';
import SignInForm from '@components/User/SignInForm.vue';
import SignUpForm from '@components/User/SignUpForm.vue';
import UserStats from '@components/User/UserStats.vue';
import IconAdd from '@icons/IconAdd.vue';
import IconExit from '@icons/IconExit.vue';
import IconSettings from '@icons/IconSettings.vue';

export default {
  components: {
    SignInForm,
    SignUpForm,
    UserStats,
    IconAdd,
    IconExit,
    IconSettings,
  },
  data() {
    return {
      USER_LOGIN_MODE: consts.USER_LOGIN_MODE,
      USER_REG_MODE: consts.USER_REG_MODE,
      mode: consts.USER_LOGIN_MODE,
    };
  },
  computed: {
    isUserAuth() {
      return this.$store.getters.isUserAuth;
    },
    user() {
      return this.$store.state.user;
    },
  },
  methods: {
    setMode(mode) {
      this.mode = mode;
    },
    async logout() {
      const res = await api.auth.logout();

      if (res.data.ok) {
        this.$store.commit('clearUser');
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.current-user {
  @include widget;

  padding: 0;

  &__logged-meta {
    justify-content: center;
    border-bottom: 1px solid $light-gray;
    background: $bg;

    @include flex-row;

    &-avatar {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      width: 50%;
      padding: 1rem;
      user-select: none;

      @include for-size(phone-only) {
        padding: 0.5rem;
      }

      img {
        width: 8rem;
        border: 1px solid $light-gray;
        border-radius: 50%;
      }
    }

    &-login {
      margin: 1rem;
      color: $main-text;
      text-align: center;
      font-size: 1rem;

      @include for-size(phone-only) {
        margin: 0.5rem;
      }
    }

    a {
      text-decoration: none;
    }
  }

  &__stats {
    flex-flow: row nowrap;
    justify-content: center;
    padding: 1rem;
    border-bottom: 1px solid $light-gray;
  }

  &__logged-nav {
    &-list {
      margin-left: 0;
      text-align: center;
      padding-inline-start: 0;
      margin-block: 0 0;
      list-style: none;

      a {
        text-decoration: none;
      }
    }

    &-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid $light-gray;
      color: $main-text;
      cursor: pointer;
      font-weight: 500;
      line-height: 24px;

      &:last-child {
        border-bottom: none;
      }

      svg {
        width: 2rem;
        margin-right: 0.5rem;
        fill: $main-text;
      }

      &:hover {
        background: $bg;
      }
    }
  }
}
</style>
