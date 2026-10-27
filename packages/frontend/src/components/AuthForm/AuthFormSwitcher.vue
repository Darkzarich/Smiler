<template>
  <div class="auth-form-switcher">
    <SignInForm v-if="isSignIn" />
    <SignUpForm v-else />

    <button
      data-testid="user-form-mode-toggler"
      class="auth-form-switcher__mode-toggler"
      @click="toggleMode()"
    >
      {{ isSignIn ? 'SIGN UP' : 'SIGN IN' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SignInForm from './SignInForm.vue';
import SignUpForm from './SignUpForm.vue';
import type { AuthPromptMode } from '@/store/auth-prompt';

interface Props {
  initialMode?: AuthPromptMode;
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'signin',
});

const isSignIn = ref(props.initialMode === 'signin');

const toggleMode = () => {
  isSignIn.value = !isSignIn.value;
};
</script>

<style>
.auth-form-switcher {
  padding: 16px;

  &__mode-toggler {
    display: block;
    width: fit-content;
    margin: 16px auto 0;
    padding: 0;
    border: none;
    border-bottom: 1px solid transparent;
    background: none;
    color: var(--color-primary-strong);
    font-size: 13px;
    cursor: pointer;

    /* Keeps the label 16px under the form, as the box grows around it */
    @media (--pointer-coarse) {
      min-height: 44px;
      margin-top: 2px;
      padding: 0 16px;
    }

    @media (--hover) {
      &:hover {
        border-bottom: 1px solid var(--color-primary-strong);
      }
    }
  }
}
</style>
