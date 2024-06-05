<template>
  <div class="auth-form-switcher">
    <SignInForm v-if="isSignIn" />
    <SignUpForm v-else />

    <div
      data-testid="user-form-mode-toggler"
      class="auth-form-switcher__mode-toggler"
      @click="toggleMode()"
    >
      {{ isSignIn ? 'OR SIGN UP' : 'OR SIGN IN' }}
    </div>
  </div>
</template>

<script>
import SignInForm from './SignInForm.vue';
import SignUpForm from './SignUpForm.vue';

export default {
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
};
</script>

<style lang="scss">
@import '@/styles/colors';

.auth-form-switcher {
  &__mode-toggler {
    margin-top: 0.5rem;
    border-bottom: 1px solid transparent;
    color: $firm;
    font-size: 0.8rem;
    cursor: pointer;

    &:hover {
      border-bottom: 1px solid $firm;
    }
  }
}
</style>
