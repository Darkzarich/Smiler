<template>
  <div v-if="isShow" id="app">
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

<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import FooterElement from '@components/FooterElement.vue';
import HeaderElement from '@components/Header/HeaderElement.vue';
import NotificationList from '@components/NotificationList/NotificationList.vue';
import CurrentUser from '@components/User/CurrentUser.vue';
import { isDesktop } from '@utils/is-desktop';

const userStore = useUserStore();
const themeStore = useThemeStore();

const isShow = ref(false);

onBeforeMount(async () => {
  await userStore.userFetchAuthState();
  isShow.value = true;
});

onMounted(() => {
  themeStore.initTheme();
});
</script>

<style lang="scss">
@use '@/styles/mixins';
@use '@/styles/utilities';
@use '@/styles/themes/dark';
@use '@/styles/themes/light';

:root {
  --variable-widget-margin: 24px;
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
  background: var(--color-surface-primary);
  overflow-y: hidden;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-surface-primary);
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 20px;
    background-color: var(--color-text-secondary);
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
