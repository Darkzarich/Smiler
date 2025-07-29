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

const isSignIn = ref(true);

const toggleMode = () => {
  isSignIn.value = !isSignIn.value;
};
</script>

<style lang="scss">
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
    color: var(--color-primary);
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-bottom: 1px solid var(--color-primary);
    }
  }
}
</style>
