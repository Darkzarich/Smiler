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
      <router-link :to="{ name: 'All' }">
        <div> ALL </div>
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

      <template v-if="user.authState">
        <router-link :to="{ name: 'Feed' }">
          <div> MY FEED </div>
        </router-link>
      </template>
      <template v-else>
        <a title="Log in to access this page" class="header-container__nav-link_disabled">
          <div> MY FEED </div>
        </a>
      </template>
    </nav>
    <div v-if="$route.name !== 'Search'"
         class="header-container__search">
      <input-element
        :place-holder="'Search'"
        icon="searchIcon"
        :style="'flex-direction: row'"
        v-model.trim="title"
        :enter-callback="search"
        :icon-click-callback="search"
      />
    </div>
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
import inputElement from '@/components/BasicElements/InputElement';


export default {
  components: {
    inputElement,
  },
  data() {
    return {
      // for search
      title: '',
    };
  },
  computed: {
    ...mapState({
      user: state => state.user,
    }),
  },
  methods: {
    search() {
      if (this.title.length > 0) {
        this.$router.push({
          name: 'Search',
          query: {
            title: this.title,
          },
        });
      }
    },
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
      .header-container__nav-link_disabled {
        color: $light-gray !important;
        border-bottom: 2px solid transparent !important;
        cursor: default;
        user-select: none;
      }
      .router-link-exact-active {
        color: $firm;
        border-bottom: 2px solid $firm !important;
      }
    }
    &__search {
      margin-left: auto;
      display: flex;
      align-items: center;
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
