<template>
  <form class="signup-form" @submit="signUp">
    <div class="signup-form__header" data-testid="signup-form">Sign Up</div>

    <div class="signup-form__input">
      <BaseInput
        v-model="email"
        data-testid="signup-form-email"
        label="Email"
        name="email"
        placeholder="Enter email"
        :error="validation.email"
      />
    </div>

    <div class="signup-form__input">
      <BaseInput
        v-model="login"
        data-testid="signup-form-login"
        label="Login"
        name="login"
        placeholder="Enter login"
        :error="validation.login"
      />
    </div>

    <div class="signup-form__input">
      <BaseInput
        v-model="password"
        data-testid="signup-form-password"
        label="Password"
        :type="'password'"
        name="password"
        :error="validation.password"
        placeholder="Enter password"
      />
    </div>

    <div class="signup-form__input">
      <BaseInput
        v-model="confirm"
        data-testid="signup-form-confirm"
        label="Confirm password"
        type="password"
        name="confirm"
        :error="validation.confirm"
        placeholder="Enter password again"
      />
    </div>

    <BaseButton
      attr-type="submit"
      class="signup-form__submit"
      stretched
      data-testid="signup-form-submit"
      :loading="isLoading"
      :disabled="isSubmitDisabled"
      @click.native="signUp"
    >
      FINISH
    </BaseButton>
  </form>
</template>

<script>
import api from '@/api';
import consts from '@/const/const';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';

export default {
  components: {
    BaseButton,
    BaseInput,
  },
  data() {
    return {
      email: '',
      login: '',
      password: '',
      confirm: '',
      isLoading: false,
      requestError: '',
    };
  },
  computed: {
    isSubmitDisabled() {
      return Boolean(
        this.validation.email ||
          this.validation.password ||
          this.validation.confirm ||
          this.validation.login,
      );
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
        validation.login = this.requestError;
      } else {
        // email

        this.requestError = '';

        if (this.email.length === 0) {
          validation.email = "Email can't be empty";
        } else if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(this.email)) {
          validation.email = 'Email is not valid';
        }

        // login

        if (this.login.length === 0) {
          validation.login = "Login can't be empty";
        } else if (
          this.login.length < consts.LOGIN_MIN_LENGTH ||
          this.login.length > consts.LOGIN_MAX_LENGTH
        ) {
          validation.login = `Login length must be ${consts.LOGIN_MIN_LENGTH}-${consts.LOGIN_MAX_LENGTH}`;
        }

        // password

        if (this.password.length === 0) {
          validation.password = "Password can't be empty";
        } else if (this.password.length < consts.PASSWORD_MIN_LENGTH) {
          validation.password = `Password length must be minimum ${consts.PASSWORD_MIN_LENGTH}`;
        }

        // confirm

        if (this.confirm.length === 0) {
          validation.confirm = "Password confirm can't be empty";
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
    async signUp(e) {
      e.preventDefault();

      if (this.isSubmitDisabled || this.isLoading) {
        return;
      }

      this.isLoading = true;

      const res = await api.auth.signUp({
        email: this.email,
        password: this.password,
        login: this.login,
        confirm: this.confirm,
      });

      this.isLoading = false;

      if (res.data.error) {
        this.email = '';
        this.password = '';
        this.confirm = '';
        this.login = '';
        this.requestError = res.data.error.message;
      } else if (res.data.isAuth) {
        this.$store.commit('setUser', res.data);
      }
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';

.signup-form {
  @include flex-col;

  align-items: center;

  &__header {
    margin-bottom: 0.5rem;
    color: var(--color-main-text);
    font-weight: bold;
  }

  &__input {
    width: 100%;
    margin-bottom: 16px;
  }

  &__submit {
    margin-top: 8px;
  }
}
</style>
