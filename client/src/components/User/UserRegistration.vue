<template>
  <div class="user-registration">
    <div class="user-registration__header">
      Registration
    </div>

    <div class="user-registration__form-input">
      <InputElement
        v-model="email"
        data-testid="user-signup-email"
        label="Email"
        name="email"
        placeholder="Enter email"
        :enter-callback="register"
        :error="validation.email"
      />
    </div>

    <div class="user-registration__form-input">
      <InputElement
        v-model="login"
        data-testid="user-signup-login"
        label="Login"
        name="login"
        placeholder="Enter login"
        :enter-callback="register"
        :error="validation.login"
      />
    </div>

    <div class="user-registration__form-input">
      <InputElement
        v-model="password"
        data-testid="user-signup-password"
        label="Password"
        :type="'password'"
        :enter-callback="register"
        name="password"
        :error="validation.password"
        placeholder="Enter password"
      />
    </div>

    <div class="user-registration__form-input">
      <InputElement
        v-model="confirm"
        data-testid="user-signup-confirm"
        label="Confirm password"
        type="password"
        :enter-callback="register"
        name="confirm"
        :error="validation.confirm"
        placeholder="Enter password again"
      />
    </div>

    <div class="user-registration__submit">
      <ButtonElement
        data-testid="user-signup-submit"
        :callback="register"
        :loading="loading"
        :disabled="isSubmitDisabled"
      >
        FINISH
      </ButtonElement>
    </div>

    <div data-testid="user-form-mode-toggler" class="user-registration__mode-toggler" @click="$emit('mode-change')">
      OR LOGIN
    </div>
  </div>
</template>

<script>
import ButtonElement from '../BasicElements/ButtonElement.vue';
import InputElement from '../BasicElements/InputElement.vue';
import api from '@/api';
import consts from '@/const/const';

export default {
  components: {
    ButtonElement,
    InputElement,
  },
  props: ['navNative'],
  data() {
    return {
      email: '',
      login: '',
      password: '',
      confirm: '',
      loading: false,
      requestError: '',
    };
  },
  computed: {
    isSubmitDisabled() {
      return !!(this.validation.email || this.validation.password
              || this.validation.confirm || this.validation.login);
    },
    validation() {
      const validation = {
        email: '',
        login: '',
        confirm: '',
        password: '',
      };

      if (this.requestError && !(this.password || this.email)) {
        validation.email = this.requestError;
        validation.password = this.requestError;
        validation.confirm = this.requestError;
        validation.login = this.requestError;
      } else {
        // email

        this.requestError = '';

        if (this.email.length === 0) {
          validation.email = 'Email can\'t be empty';
        } else if (!/.+@.+\.[a-z]+/.test(this.email)) {
          validation.email = 'Email is not valid';
        }

        // login

        if (this.login.length === 0) {
          validation.login = 'Login can\'t be empty';
        } else if (this.login.length < consts.LOGIN_MIN_LENGTH
        || this.login.length > consts.LOGIN_MAX_LENGTH) {
          validation.login = `Login length must be ${consts.LOGIN_MIN_LENGTH}-${consts.LOGIN_MAX_LENGTH}`;
        }

        // password

        if (this.password.length === 0) {
          validation.password = 'Password can\'t be empty';
        } else if (this.password.length < consts.PASSWORD_MIN_LENGTH) {
          validation.password = `Password length must be minimum ${consts.PASSWORD_MIN_LENGTH}`;
        }

        // confirm

        if (this.confirm.length === 0) {
          validation.confirm = 'Password confirm can\'t be empty';
        } else if (this.confirm.length < consts.PASSWORD_MIN_LENGTH) {
          validation.confirm = `Password confirm length must be minimum ${consts.PASSWORD_MIN_LENGTH}`;
        } else if (this.confirm !== this.password) {
          validation.confirm = 'Password and password confirm must be equal';
        }
      }

      return validation;
    },
  },
  methods: {
    async register() {
      this.loading = true;

      const res = await api.users.createUser({
        email: this.email,
        password: this.password,
        login: this.login,
        confirm: this.confirm,
      });

      this.loading = false;

      if (res.data.error) {
        this.email = '';
        this.password = '';
        this.confirm = '';
        this.login = '';
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

.user-registration {
  @include flex-col;

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
