<template>
  <header class="header">
    <div class="header-container">
      <div
        data-testid="mobile-menu"
        class="header-container__mobile_menu"
        :class="mobileMenuShow ? 'header-container__mobile_active' : ''"
        @click="mobileMenuShow = !mobileMenuShow"
      >
        <MobileMenuIcon />
      </div>
      <Transition name="header-container__mobile_menu">
        <HeaderMobileMenu v-if="mobileMenuShow" @close="mobileMenuShow = false" />\
      </Transition>
      <RouterLink :to="{ name: 'Home' }">
        <img src="@/assets/logo.png" class="header-container__logo" alt="Home">
        <img src="@/assets/neutral_avatar.png" class="header-container__logo_mobile" alt="Home">
      </RouterLink>
      <nav>
        <template v-if="!$isMobile()">
          <RouterLink :to="{ name: 'Home' }" data-testid="today-link">
            <div> TODAY </div>
          </RouterLink>
          <RouterLink :to="{ name: 'All' }" data-testid="all-link">
            <div> ALL </div>
          </RouterLink>
          <RouterLink :to="{ name: 'Blowing' }" data-testid="blowing-link">
            <div title="posted recently, 50+ rating">
              BLOWING
            </div>
          </RouterLink>
          <RouterLink :to="{ name: 'TopThisWeek' }" data-testid="top-this-week-link">
            <div title="current week posts sorted by newer">
              TOP THIS WEEK
            </div>
          </RouterLink>
          <RouterLink :to="{ name: 'New' }" data-testid="new-link">
            <div title="posts posted 2 hours ago sorted by newer">
              NEW
            </div>
          </RouterLink>

          <template v-if="user.authState">
            <RouterLink :to="{ name: 'Feed' }">
              <div> MY FEED </div>
            </RouterLink>
          </template>
          <template v-else>
            <a title="Log in to access this page" class="header-container__nav-link_disabled">
              <div> MY FEED </div>
            </a>
          </template>
        </template>
      </nav>
      <div
        v-if="$route.name !== 'Search'"
        class="header-container__search"
      >
        <InputElement
          v-model.trim="title"
          :placeholder="'Search'"
          icon="SearchIcon"
          :style="'flex-direction: row'"
          :enter-callback="search"
          :icon-click-callback="search"
        />
      </div>
      <div
        v-if="user.authState"
        class="header-container__avatar"
      >
        <RouterLink
          :to="{
            name: 'UserPage',
            params: {
              login: user.login,
            },
          }"
        >
          <img :src="$resolveAvatar(user.avatar)" alt="avatar">
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState } from 'vuex';
import HeaderMobileMenu from './HeaderMobileMenu.vue';
import InputElement from '@/components/BasicElements/InputElement.vue';
import MobileMenuIcon from '@/library/svg/MobileMenuIcon.vue';

export default {
  components: {
    HeaderMobileMenu,
    InputElement,
    MobileMenuIcon,
  },
  data() {
    return {
      mobileMenuShow: false,
      // for search
      title: '',
    };
  },
  computed: {
    ...mapState({
      user: (state) => state.user,
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
    background-color: $header;
    height: $header-height;
    width: 100%;
    position: fixed;
    top: 0;
    z-index: 2;
    padding: 0.5rem;
    height: 40px;
    @include for-size(phone-only) {
      height: 30px;
    }
    display: flex;
    justify-content: center;
  }

  .header-container {
    display: flex;
    padding-left: 80px;
    padding-right: 10px;
    @include for-size(phone-only) {
      padding-left: 0px;
      padding-right: 0px;
    }
    width: 100%;
    max-width: 1110px;
    nav {
      @include flex-row();
      align-items: center;
      margin-left: 4rem;
      @include for-size(phone-only) {
        margin-left: 0;
      }
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
      @include for-size(phone-only) {
        margin-right: 1rem;
      }
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
      .header-container__logo {
        height: 100%;
        @include for-size(phone-only) {
          display: none;
        }
        &_mobile {
          display: none;
          height: 100%;
          @include for-size(phone-only) {
            display: inline-block;
          }
        }
      }
    }
    &__mobile_menu {
      display: none;
      margin-right: 1rem;
      cursor: pointer;
      @include for-size(phone-only) {
        display: block;
        svg {
          height: 100%;
          fill: $light-gray;
        }
      }
      &-enter-active, &-leave-active {
        transition: all 0.2s;
      }

      &-enter, &-leave-to {
        opacity: 0;
        transform: translateY(15px);
        @include for-size(phone-only) {
          transform: translateY(-15px);
        }
      }
    }
    &__mobile_active {
      svg {
        fill: $main-text;
      }
    }
  }
</style>
