<template>
<header class="header">
  <div class="header-container">
    <router-link :to="{ name: 'Home' }">
      <img src="@/assets/logo.png" alt="Home">
    </router-link>
    <nav>
      <router-link :to="{ name: 'Home' }">
        <div> TODAY </div>
      </router-link>
      <router-link :to="{ name: 'Blowing' }">
        <div title="posted recently, 50+ rating"> BLOWING </div>
      </router-link>
      <router-link :to="{ name: 'TopThisWeek' }">
        <div title="current week posts sorted by newer"> TOP THIS WEEK </div>
      </router-link>
      <router-link :to="{ name: 'New' }">
        <div title="posts posted 2 hours ago sorted by newer"> NEW </div>
      </router-link>
      <router-link :to="{ name: 'Feed' }">
        <div> MY FEED </div>
      </router-link>
    </nav>
    <div
      class="header-container__avatar"
      v-if="user.authState"
    >
      <router-link :to="{
        name: 'UserPage',
          params: {
            login: user.login
          }
      }">
        <img :src="$resolveAvatar(user.avatar)" alt="avatar">
      </router-link>
    </div>
  </div>
</header>
</template>

<script>
import { mapState } from 'vuex';

export default {

  computed: {
    ...mapState({
      user: state => state.user,
    }),
  },
};
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
@import '@/styles/colors.scss';

  .header {
    background-color: $widget-bg;
    height: $header-height;
    width: 100%;
    position: fixed;
    top: 0;
    z-index: 2;
    padding: 0.5rem;
    height: 40px;
    display: flex;
    justify-content: center;
  }

  .header-container {
    display: flex;
    padding-left: 80px;
    padding-right: 10px;
    width: 100%;
    max-width: 1110px;
    nav {
      @include flex-row();
      align-items: center;
      margin-left: 4rem;
      a {
        color: $main-text;
        padding-top: 5px;
        border-bottom: 2px solid transparent;
        text-decoration: none;
        font-weight: bold;
        margin-left: 1rem;
        &:hover {
          border-bottom: 2px solid $main-text;
        }
      }
      .router-link-exact-active {
        color: $firm;
        border-bottom: 2px solid $firm;
      }
    }
    &__avatar {
      display: flex;
      margin-left: auto;
      margin-right: 3rem;
      align-self: center;
      img {
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        cursor: pointer;
      }
    }
    > a {
      color: $main-text;
      text-decoration: none;
      width: 10%;
      img {
        height: 100%;
      }
    }
  }
</style>
