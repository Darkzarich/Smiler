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
  --header-height: 46px;

  /* Wide enough for a five-digit rating. The page column is padded by it, so
     everything lines up with the post cards and a Post hangs its votes into it. */
  --post-votes-width: 0px;

  /* A page title and a post title are the same step: each is its page's h1 */
  --font-size-title: 1.25rem;
  --font-size-heading: 1.125rem;

  @media (--tablet-portrait-up) {
    --page-gutter: 16px;
    --header-height: 56px;
    --post-votes-width: 64px;
    --font-size-title: 1.5rem;
  }

  @media (--tablet-landscape-up) {
    --page-gutter: 24px;
  }
}

html {
  font-family: 'Roboto Variable', Roboto, system-ui, sans-serif;
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

  /* Not hidden: that makes #app a scroll container, and the sidebar would
     stick to it instead of the window */
  overflow-x: clip;
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
    padding-left: var(--post-votes-width);

    @media (--phone-only) {
      width: 100%;
      margin-right: 0;
    }

    /* No gutter on phones: a card runs edge to edge, and round corners would
       cut into the screen's edge. It keeps its padding. */
    .u-widget {
      @media (--phone-only) {
        border-radius: 0;
      }
    }
  }

  &__sidebar {
    width: 26%;

    @media (--sidebar-fits) {
      position: sticky;
      top: 72px;
      align-self: flex-start;
    }
  }
}
</style>
