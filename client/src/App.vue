<template>
  <div v-if="show" id="app">
    <NotificationList />

    <HeaderElement />

    <div class="content">
      <content class="content__main">
        <RouterView />
      </content>

      <div v-if="$isDesktop()" class="content__sidebar">
        <CurrentUser />
      </div>
    </div>

    <FooterElement />
  </div>
</template>

<script>
import FooterElement from '@components/FooterElement.vue';
import HeaderElement from '@components/Header/HeaderElement.vue';
import NotificationList from '@components/NotificationList/NotificationList.vue';
import CurrentUser from '@components/User/CurrentUser.vue';

// TODO: global mini loader fixed to top
export default {
  components: {
    HeaderElement,
    FooterElement,
    NotificationList,
    CurrentUser,
  },
  data() {
    return {
      show: false,
    };
  },
  beforeCreate() {
    this.$store.dispatch('userGetAuthState').then(() => {
      this.show = true;
    });
  },
};
</script>

<style lang="scss">
@import '@/styles/variables';
@import '@/styles/colors';
@import '@/styles/mixins';

html {
  font-family: Roboto, 'Open Sans', Helvetica, Arial, sans-serif;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

body {
  margin: 0;
  background: $bg;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: $bg;
  }

  &::-webkit-scrollbar-thumb {
    background-color: $light-gray;
    border-radius: 20px;
  }
}

#app {
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  display: flex;
  flex-flow: row nowrap;
  flex-grow: 1;
  margin-top: $header-height-interval;
  max-width: 1110px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-right: 10px;

  @include for-size(phone-only) {
    padding-right: 0;
  }

  &__main {
    width: 70%;
    margin-right: $widget-margin;

    @include for-size(phone-only) {
      width: 100%;
      margin-right: 0;
    }
  }

  &__sidebar {
    width: 30%;

    @include for-size(phone-only) {
      display: none;
    }
  }
}
</style>
