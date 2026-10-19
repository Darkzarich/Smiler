<template>
  <BaseModal
    :is-open="authPrompt.isOpen"
    data-testid="auth-prompt"
    @close="authPrompt.close()"
  >
    <template #header>
      <div class="auth-prompt__header">
        <span data-testid="auth-prompt-title">{{ authPrompt.title }}</span>

        <BaseIconButton
          label="Close"
          data-testid="auth-prompt-close"
          size="medium"
          @click="authPrompt.close()"
        >
          <IconClose />
        </BaseIconButton>
      </div>
    </template>

    <div ref="contentRef" class="auth-prompt">
      <p class="auth-prompt__lead">
        You need an account for that. Sign in, or create one in under a minute.
      </p>

      <!-- Keyed to start fresh, in the mode asked for, on every opening -->
      <AuthFormSwitcher :key="openCount" :initial-mode="authPrompt.mode" />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { nextTick, ref, watch } from 'vue';
import AuthFormSwitcher from './AuthFormSwitcher.vue';
import { useMediaQuery } from '@/composables/use-media-query';
import { useAuthPromptStore } from '@/store/auth-prompt';
import { useUserStore } from '@/store/user';
import BaseIconButton from '@common/BaseIconButton.vue';
import BaseModal from '@common/BaseModal.vue';
import IconClose from '@icons/IconClose.vue';

const authPrompt = useAuthPromptStore();
const { user } = storeToRefs(useUserStore());

const isTouch = useMediaQuery('pointer-coarse');

const contentRef = ref<HTMLElement | null>(null);
const openCount = ref(0);

let returnFocusTo: HTMLElement | null = null;

watch(
  () => authPrompt.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      returnFocusTo?.focus();
      returnFocusTo = null;

      return;
    }

    openCount.value++;
    returnFocusTo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    await nextTick();

    // On touch screens the keyboard would cover the sheet before it is read
    if (!isTouch.value) {
      contentRef.value?.querySelector('input')?.focus();
    }
  },
);

watch(user, (current) => {
  if (current && authPrompt.isOpen) {
    authPrompt.complete();
  }
});
</script>

<style>
.auth-prompt {
  width: 340px;
  max-width: 100%;

  @media (--phone-only) {
    width: 100%;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin: -6px -6px -6px 0;
  }

  &__lead {
    margin: 0 0 16px;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.4;
  }

  .auth-form-switcher {
    padding: 0;
  }
}
</style>
