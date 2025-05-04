<template>
  <form class="signin-form">
    <div class="signin-form__header" data-testid="signin-form">Sign In</div>

    <div class="signin-form__input">
      <BaseInput
        v-model="email"
        data-testid="signin-form-email"
        label="Email"
        name="email"
        placeholder="Enter email"
        :error="validation.email"
      />
    </div>

    <div class="signin-form__input">
      <BaseInput
        v-model="password"
        data-testid="signin-form-password"
        label="Password"
        type="password"
        name="password"
        :error="validation.password"
        placeholder="Enter password"
      />
    </div>

    <BaseButton
      attr-type="submit"
      class="signin-form__submit"
      stretched
      data-testid="signin-form-submit"
      :loading="isLoading"
      :disabled="isSubmitDisabled"
      @click.prevent="signIn"
    >
      SIGN IN
    </BaseButton>
  </form>
</template>

<script>
import { defineComponent } from 'vue';
import api from '@/api';
import consts from '@/const/const';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';

export default defineComponent({
  components: {
    BaseButton,
    BaseInput,
  },
  data() {
    return {
      email: '',
      password: '',
      isLoading: false,
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
          validation.email = "Email can't be empty";
        } else if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(this.email)) {
          validation.email = 'Email is not valid';
        }

        // password

        if (this.password.length === 0) {
          validation.password = "Password can't be empty";
        } else if (this.password.length < consts.PASSWORD_MIN_LENGTH) {
          validation.password = `Password length must be minimum ${consts.PASSWORD_MIN_LENGTH}`;
        }
      }

      return validation;
    },
  },
  methods: {
    async signIn() {
      if (this.isSubmitDisabled || this.isLoading) {
        return;
      }

      this.isLoading = true;

      const res = await api.auth.signIn({
        email: this.email,
        password: this.password,
      });

      this.isLoading = false;

      if (res.data.error) {
        this.email = '';
        this.password = '';
        this.requestError = res.data.error.message;
      } else if (res.data.isAuth) {
        this.$store.commit('setUser', res.data);
      }
    },
  },
});
</script>

<style lang="scss">
@import '@/styles/mixins';

.signin-form {
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
