<template>
  <div v-if="isShow" id="app">
    <NotificationList />

    <HeaderElement />

    <div class="content">
      <main class="content__main">
        <RouterView />
      </main>

      <div v-if="!isPhone" class="content__sidebar">
        <CurrentUser />
      </div>
    </div>

    <FooterElement />

    <AuthPromptModal />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue';
import { useMediaQuery } from '@/composables/use-media-query';
import { useThemeStore } from '@/store/theme';
import { useUserStore } from '@/store/user';
import AuthPromptModal from '@components/AuthForm/AuthPromptModal.vue';
import FooterElement from '@components/FooterElement.vue';
import HeaderElement from '@components/Header/HeaderElement.vue';
import NotificationList from '@components/NotificationList/NotificationList.vue';
import CurrentUser from '@components/User/CurrentUser.vue';

const userStore = useUserStore();
const themeStore = useThemeStore();

const isPhone = useMediaQuery('phone-only');

const isShow = ref(false);

onBeforeMount(async () => {
  await userStore.userFetchAuthState();
  isShow.value = true;
});

onMounted(() => {
  themeStore.initTheme();
});
</script>

<style>
@import '@/styles/utilities.css';
@import '@/styles/rich-text.css';
@import '@/styles/themes/dark.css';
@import '@/styles/themes/light.css';

:root {
  --variable-widget-margin: 24px;
  --page-max-width: 1110px;
  --page-gutter: 0px;

  @media (--tablet-portrait-up) {
    --page-gutter: 16px;
  }

  @media (--tablet-landscape-up) {
    --page-gutter: 24px;
  }
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

/* One keyboard focus ring for every control. Fields that draw their own (a
   border color) opt out with outline: none on :focus. */
:focus-visible {
  outline: 2px solid var(--color-primary-strong);
  outline-offset: 2px;
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
  max-width: calc(var(--page-max-width) + 2 * var(--page-gutter));
  margin-top: 72px;
  margin-right: auto;
  margin-left: auto;
  padding-inline: var(--page-gutter);

  &__main {
    flex: 1;
    margin-right: var(--variable-widget-margin);

    @media (--phone-only) {
      width: 100%;
      margin-right: 0;
    }
  }

  &__sidebar {
    width: 26%;
  }
}
</style>
