<template>
  <div class="user">
    <template v-if="!getUserAuthState">
      <template v-if="mode == USER_LOGIN_MODE">
        <UserLogin
          @close="closeMenu"
          @mode-change="setMode(USER_REG_MODE)"
        />
      </template>
      <template v-else-if="mode == USER_REG_MODE">
        <UserRegistration
          @close="closeMenu"
          @mode-change="setMode(USER_LOGIN_MODE)"
        />
      </template>
    </template>

    <template v-else>
      <div class="user__logged-block">
        <div class="user__logged-meta">
          <div class="user__logged-meta-avatar">
            <RouterLink
              :to="{
                name: 'UserPage',
                params: {
                  login: getUser.login,
                },
              }"
              @click.native="navNative ? closeMenu() : ''"
            >
              <img
                :src="$resolveAvatar(getUser.avatar)"
                :alt="getUser.avatar"
              />
              <div
                class="user__logged-meta-login"
                data-testid="user-login"
              >
                {{ getUser.login }}
              </div>
            </RouterLink>
          </div>
        </div>
        <div class="user__logged-info">
          <div class="user__logged-info-rating">
            <div>Rating</div>
            <div data-testid="user-rating">
              {{ getUser.rating }}
            </div>
          </div>
          <div class="user__logged-info-rating">
            <div>Followers</div>
            <div data-testid="user-followers-amount">
              {{ getUser.followersAmount }}
            </div>
          </div>
        </div>
        <div class="user__logged-nav">
          <ul class="user__logged-nav-list">
            <RouterLink
              data-testid="create-post-btn"
              :to="{
                name: 'PostCreate',
              }"
              @click.native="navNative ? closeMenu() : ''"
            >
              <li class="user__logged-nav-item"><AddIcon /> New Post</li>
            </RouterLink>
            <RouterLink
              :to="{
                name: 'UserSettings',
              }"
              @click.native="navNative ? closeMenu() : ''"
            >
              <li class="user__logged-nav-item"><SettingsIcon /> Settings</li>
            </RouterLink>
            <li
              class="user__logged-nav-item"
              data-testid="logout-btn"
              @click="logout"
            >
              <ExitIcon /> Logout
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import api from '@/api';
import UserLogin from '@/components/User/UserLogin.vue';
import UserRegistration from '@/components/User/UserRegistration.vue';
import consts from '@/const/const';
import AddIcon from '@/library/svg/AddIcon.vue';
import ExitIcon from '@/library/svg/ExitIcon.vue';
import SettingsIcon from '@/library/svg/SettingsIcon.vue';

export default {
  components: {
    UserLogin,
    UserRegistration,
    AddIcon,
    ExitIcon,
    SettingsIcon,
  },
  props: ['navNative'],
  data() {
    return {
      USER_LOGIN_MODE: consts.USER_LOGIN_MODE,
      USER_REG_MODE: consts.USER_REG_MODE,
      mode: consts.USER_LOGIN_MODE,
    };
  },
  computed: {
    getUserAuthState() {
      return this.$store.getters.getUserAuthState;
    },
    getUser() {
      return this.$store.getters.getUser;
    },
  },
  methods: {
    setMode(mode) {
      this.mode = mode;
    },
    async logout() {
      const res = await api.users.logoutUser();

      if (res.data.ok) {
        this.$store.commit('clearUser');
      }
    },
    // emit close event to HeaderMobileMenu, which will close the menu
    closeMenu() {
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.user {
  @include widget;

  padding: 0;

  &__logged-meta {
    border-bottom: 1px solid $light-gray;

    @include flex-row;

    background: $bg;
    justify-content: center;

    &-avatar {
      justify-content: center;
      display: flex;
      user-select: none;
      flex-flow: column nowrap;
      padding: 1rem;

      @include for-size(phone-only) {
        padding: 0.5rem;
      }

      align-items: center;
      width: 50%;

      img {
        border-radius: 50%;
        width: 8rem;
      }
    }

    &-login {
      color: $main-text;
      font-size: 1rem;
      text-align: center;
      margin: 1rem;

      @include for-size(phone-only) {
        margin: 0.5rem;
      }
    }

    a {
      text-decoration: none;
    }
  }

  &__logged-info {
    display: flex;
    justify-content: center;
    flex-flow: row nowrap;
    color: $main-text;
    padding: 1rem;
    border-bottom: 1px solid $light-gray;

    div {
      text-align: center;
      margin-right: 0.5rem;
    }
  }

  &__logged-nav {
    &-list {
      margin-left: 0;
      padding-inline-start: 0;
      margin-block: 0 0;
      list-style: none;
      text-align: center;

      a {
        text-decoration: none;
      }
    }

    &-item {
      cursor: pointer;
      color: $main-text;
      font-weight: 500;
      padding: 1rem;
      display: flex;
      flex-direction: row;
      align-items: center;
      border-bottom: 1px solid $light-gray;

      svg {
        fill: $main-text;
        margin-right: 0.5rem;
        width: 2rem;
      }

      &:hover {
        background: $bg;
      }
    }
  }
}
</style>
