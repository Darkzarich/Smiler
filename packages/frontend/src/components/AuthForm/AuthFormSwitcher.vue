<template>
  <div class="auth-form-switcher">
    <SignInForm v-if="isSignIn" />
    <SignUpForm v-else />

    <div
      data-testid="user-form-mode-toggler"
      class="auth-form-switcher__mode-toggler"
      @click="toggleMode()"
    >
      {{ isSignIn ? 'SIGN UP' : 'SIGN IN' }}
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import SignInForm from './SignInForm.vue';
import SignUpForm from './SignUpForm.vue';

export default defineComponent({
  components: {
    SignInForm,
    SignUpForm,
  },
  data() {
    return {
      isSignIn: true,
    };
  },
  methods: {
    toggleMode() {
      this.isSignIn = !this.isSignIn;
    },
  },
});
</script>

<style lang="scss">
.auth-form-switcher {
  padding: 16px;

  &__mode-toggler {
    width: fit-content;
    margin: 16px auto 0;
    border-bottom: 1px solid transparent;
    color: var(--color-primary);
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-bottom: 1px solid var(--color-primary);
    }
  }
}
</style>
