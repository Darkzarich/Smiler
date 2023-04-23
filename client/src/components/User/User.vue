<template>
  <div class="user">

    <template v-if="!getUserAuthState">
      <template v-if="mode == USER_LOGIN_MODE">
        <user-login @close="closeMenu" @mode-change="setMode(USER_REG_MODE)" />
      </template>
      <template v-else-if="mode == USER_REG_MODE">
        <user-registration @close="closeMenu" @mode-change="setMode(USER_LOGIN_MODE)" />
      </template>
    </template>

    <template v-else>
      <div class="user__logged-block">
        <div class="user__logged-meta">
          <div class="user__logged-meta-avatar">
            <router-link
              @click.native="navNative ? closeMenu() : ''"
              :to="{
                name: 'UserPage',
                params: {
                  login: getUser.login,
                },
              }">
              <img :src="$resolveAvatar(getUser.avatar)" :alt="getUser.avatar">
              <div class="user__logged-meta-login">
                {{ getUser.login }}
              </div>
            </router-link>
          </div>

        </div>
        <div class="user__logged-info">
          <div class="user__logged-info-rating">
            <div>Rating</div>
            <div>{{ getUser.rating }}</div>
          </div>
          <div class="user__logged-info-rating">
            <div>Followers</div>
            <div>{{ getUser.followersAmount }}</div>
          </div>
        </div>
        <div class="user__logged-nav">
          <ul class="user__logged-nav-list">
            <router-link
              @click.native="navNative ? closeMenu() : ''"
              :to="{
                name: 'PostCreate',
              }">
              <li class="user__logged-nav-item">
                <add-icon /> New Post
              </li>
            </router-link>
            <router-link
              @click.native="navNative ? closeMenu() : ''"
              :to="{
                name: 'UserSettings',
              }">
              <li class="user__logged-nav-item">
                <settings-icon /> Settings
              </li>
            </router-link>
            <li class="user__logged-nav-item" @click="logout">
              <exit-icon /> Logout
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import consts from '@/const/const';
import api from '@/api';

import UserLogin from '@/components/User/UserLogin.vue';
import UserRegistration from '@/components/User/UserRegistration.vue';

import exitIcon from '@/library/svg/exit.vue';
import settingsIcon from '@/library/svg/settings.vue';
import addIcon from '@/library/svg/add.vue';

export default {
  components: {
    UserLogin,
    UserRegistration,
    settingsIcon,
    exitIcon,
    addIcon,
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
        document.location.reload();
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
@import '@/styles/colors.scss';
@import '@/styles/mixins.scss';

.user {
  @include widget();
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
        flex-direction: column;
        flex-wrap: nowrap;
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
    flex-direction: row;
    flex-wrap: nowrap;
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
      margin-block-start: 0em;
      margin-block-end: 0em;
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
