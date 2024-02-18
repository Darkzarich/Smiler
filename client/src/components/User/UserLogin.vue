<template>
  <div class="user-login">
    <div class="user-login__header" data-testid="user-signin-form">
      Login
    </div>
    <div class="user-login__form-input">
      <input-element
        data-testid="user-signin-email"
        label="Email"
        name="email"
        placeholder="Enter email"
        :enter-callback="login"
        :error="validation.email"
        v-model="email" />
    </div>
    <div class="user-login__form-input">
      <input-element
        data-testid="user-signin-password"
        label="Password"
        type="password"
        name="password"
        :enter-callback="login"
        :error="validation.password"
        placeholder="Enter password"
        v-model="password" />
    </div>
    <div class="user-login__submit">
      <button-element
        data-testid="user-signin-submit"
        :callback="login"
        :loading="loading"
        :disabled="isSubmitDisabled"
      >
        SIGN IN
      </button-element>
    </div>
    <div @click="$emit('mode-change')" data-testid="user-form-mode-toggler" class="user-login__mode-toggler">
      OR REGISTRATION
    </div>
  </div>
</template>

<script>
import api from '@/api';

import consts from '@/const/const';
import ButtonElement from '../BasicElements/ButtonElement.vue';
import InputElement from '../BasicElements/InputElement.vue';

export default {
  components: {
    ButtonElement,
    InputElement,
  },
  props: ['navNative'],
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      requestError: '',
    };
  },
  computed: {
    isSubmitDisabled() {
      return !!(this.validation.email || this.validation.password);
    },
    validation() {
      const validation = {
        email: '',
        password: '',
      };

      if (this.requestError && !(this.password || this.email)) {
        validation.email = this.requestError;
        validation.password = this.requestError;
      } else {
        // email

        this.requestError = '';

        if (this.email.length === 0) {
          validation.email = 'Email can\'t be empty';
        } else if (!/.+@.+\.[a-z]+/.test(this.email)) {
          validation.email = 'Email is not valid';
        }

        // password

        if (this.password.length === 0) {
          validation.password = 'Password can\'t be empty';
        } else if (this.password.length < consts.PASSWORD_MIN_LENGTH) {
          validation.password = `Password length must be minimum ${consts.PASSWORD_MIN_LENGTH}`;
        }
      }

      return validation;
    },
  },
  methods: {
    async login() {
      this.loading = true;

      const res = await api.users.authUser({
        email: this.email,
        password: this.password,
      });

      this.loading = false;

      if (res.data.error) {
        this.email = '';
        this.password = '';
        this.requestError = res.data.error.message;
      } else if (res.data.isAuth) {
        this.$store.commit('setUser', res.data);
        this.closeMenu();
      }
    },
    // emit close event to HeaderMobileMenu, which will close the menu
    closeMenu() {
      this.$emit('close');
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';
@import '@/styles/colors';

.user-login {
  @include flex-col();
  align-items: center;
  padding: 1rem;

  &__form-input {
    margin-bottom: 12px;
    width: 100%;
  }

  &__header {
    color: $main-text;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  &__mode-toggler {
    color: $firm;
    font-size: 0.8rem;
    margin-top: 0.5rem;
    cursor: pointer;
    border-bottom: 1px solid transparent;
    &:hover {
      border-bottom: 1px solid $firm;
    }
  }

  &__submit {
    width: 100%;
  }
}
</style>
