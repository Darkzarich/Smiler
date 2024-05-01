<template>
  <div v-if="show" id="app">
    <SystemNotification />
    <HeaderElement />
    <!-- <div id="nav">
        <router-link to="/">Home</router-link> |
        <router-link to="/about">About</router-link>
      </div> -->
    <div class="content-box">
      <content class="content-box__main">
        <RouterView />
      </content>
      <div v-if="!$isMobile()" class="content-box__sidebar">
        <User />
      </div>
    </div>

    <FooterElement />
  </div>
</template>

<script>
import FooterElement from '@/components/FooterElement.vue';
import HeaderElement from '@/components/Header/HeaderElement.vue';
import SystemNotification from '@/components/SystemNotification/SystemNotification.vue';
import User from '@/components/User/User.vue';

// TODO: global mini loader fixed to top
export default {
  components: {
    HeaderElement,
    FooterElement,
    SystemNotification,
    User,
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
}

body {
  margin: 0;
  background: $bg;
}

#app {
  min-height: 100vh;
  overflow-x: hidden;
}

.content-box {
  margin-top: $header-height-interval;
  max-width: 1110px;
  min-height: 100vh;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-flow: row nowrap;
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
