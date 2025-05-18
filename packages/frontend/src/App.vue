<template>
  <div v-if="show" id="app">
    <NotificationList />

    <HeaderElement />

    <div class="content">
      <main class="content__main">
        <RouterView />
      </main>

      <div v-if="isDesktop()" class="content__sidebar">
        <CurrentUser />
      </div>
    </div>

    <FooterElement />
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useUserStore } from '@/store/user';
import FooterElement from '@components/FooterElement.vue';
import HeaderElement from '@components/Header/HeaderElement.vue';
import NotificationList from '@components/NotificationList/NotificationList.vue';
import CurrentUser from '@components/User/CurrentUser.vue';
import { isDesktop } from '@utils/is-desktop';

// TODO: global mini loader fixed to top
export default defineComponent({
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
    const userStore = useUserStore();

    userStore.userFetchAuthState().then(() => {
      this.show = true;
    });
  },
  methods: {
    isDesktop,
  },
});
</script>

<style lang="scss">
@use '@/styles/mixins';

:root {
  --variable-widget-margin: 24px;
}

[color-scheme='dark'] {
  --color-primary: #86c232;
  --color-primary-dark: #61892f;
  --color-danger: #ff4646;
  --color-danger-dark: #892f2f;
  --color-gray: #474b4f;
  --color-gray-light: #6b6e70;
  --color-white: #fff;
  --color-black: #000;
  --color-main-text: #bfbfbf;
  --color-header: #1f2529;
  --color-bg: #1c2125;
  --color-widget-bg: #272b2d;
  --color-comments-animation: #7fbc3236;
  --color-scrollbar: #f5f5f5;
}

html {
  font-family: Roboto, 'Open Sans', Helvetica, Arial, sans-serif;
  box-sizing: border-box;
  overflow-y: scroll;
  scrollbar-gutter: stable;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

body {
  margin: 0;
  background: var(--color-bg);
  overflow-y: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-bg);
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 20px;
    background-color: var(--color-gray-light);
  }
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.content {
  display: flex;
  flex-grow: 1;
  flex-flow: row nowrap;
  width: 100%;
  max-width: 1110px;
  margin-top: 72px;
  margin-right: auto;
  margin-left: auto;

  &__main {
    flex: 1;
    margin-right: var(--variable-widget-margin);

    @include mixins.for-size(phone-only) {
      width: 100%;
      margin-right: 0;
    }
  }

  &__sidebar {
    width: 26%;

    @include mixins.for-size(phone-only) {
      display: none;
    }
  }
}
</style>
