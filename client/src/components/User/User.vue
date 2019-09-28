<template>
  <div class="user">
    <template v-if="!getUserAuthState">
      <template v-if="mode == USER_LOGIN_MODE">
        <user-login/>
        <div
          @click="setMode(USER_REG_MODE)"
          class="user__mode-toggler"
        >
          Registration
        </div>
      </template>
      <template v-else-if="mode == USER_REG_MODE">
        <user-registration/>
        <div
          @click="setMode(USER_LOGIN_MODE)"
          class="user__mode-toggler"
        >
          Login
        </div>
      </template>
    </template>
    <template v-else>
      <div class="user__logged-block">
        <div class="user__logged-meta">
          <div class="user__logged-meta-avatar">
            <img :src="$resolveAvatar(getUser.avatar)">
            <div class="user__logged-meta-login">
              {{ getUser.login }}
            </div>
          </div>
        </div>
        <div class="user__logged-info">
            <div class="user__logged-info-rating">
              <div>Rating</div>
              <div>{{ getUser.rating }}</div>
            </div>
        </div>
        <div class="user__logged-nav">
          <ul class="user__logged-nav-list">
            <li class="user__logged-nav-item" @click="">
              <add-icon/> New Post
            </li>
            <li class="user__logged-nav-item" @click="logout">
              <exit-icon/> Logout
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

import UserLogin from '@/components/User/UserLogin';
import UserRegistration from '@/components/User/UserRegistration';

import exitIcon from '@/library/svg/exit';
import addIcon from '@/library/svg/add';

export default {
  components: {
    UserLogin,
    UserRegistration,
    exitIcon,
    addIcon,
  },
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
      flex-direction: column;
      flex-wrap: nowrap;
      padding: 1rem;
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
