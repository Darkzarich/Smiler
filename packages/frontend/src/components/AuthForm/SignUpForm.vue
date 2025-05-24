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
      @click.prevent="signUp"
    >
      FINISH
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api';
import * as consts from '@/const';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';

const { user } = storeToRefs(useUserStore());

const email = ref('');
const login = ref('');
const password = ref('');
const confirm = ref('');
const isLoading = ref(false);
const requestError = ref('');

const validation = computed(() => {
  const validation = {
    email: '',
    login: '',
    confirm: '',
    password: '',
  };

  if (requestError.value && !(password.value || email.value)) {
    validation.email = requestError.value;
    validation.login = requestError.value;
  } else {
    // email
    requestError.value = '';

    if (email.value.length === 0) {
      validation.email = "Email can't be empty";
    } else if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(email.value)) {
      validation.email = 'Email is not valid';
    }

    // login
    if (login.value.length === 0) {
      validation.login = "Login can't be empty";
    } else if (
      login.value.length < consts.LOGIN_MIN_LENGTH ||
      login.value.length > consts.LOGIN_MAX_LENGTH
    ) {
      validation.login = `Login length must be ${consts.LOGIN_MIN_LENGTH}-${consts.LOGIN_MAX_LENGTH}`;
    }

    // password
    if (password.value.length === 0) {
      validation.password = "Password can't be empty";
    } else if (password.value.length < consts.PASSWORD_MIN_LENGTH) {
      validation.password = `Password length must be minimum ${consts.PASSWORD_MIN_LENGTH}`;
    }

    // confirm
    if (confirm.value.length === 0) {
      validation.confirm = "Password confirm can't be empty";
    } else if (confirm.value.length < consts.PASSWORD_MIN_LENGTH) {
      validation.confirm = `Password confirm length must be minimum ${consts.PASSWORD_MIN_LENGTH}`;
    } else if (confirm.value !== password.value) {
      validation.confirm = 'Password and password confirm must be equal';
    }
  }

  return validation;
});

const isSubmitDisabled = computed(() => {
  return Boolean(
    validation.value.email ||
      validation.value.password ||
      validation.value.confirm ||
      validation.value.login,
  );
});

async function signUp() {
  if (isSubmitDisabled.value || isLoading.value) {
    return;
  }

  try {
    isLoading.value = true;

    const data = await api.auth.signUp({
      email: email.value,
      password: password.value,
      login: login.value,
      confirm: confirm.value,
    });

    user.value = data;
  } catch (e) {
    const error = e as Error;

    email.value = '';
    password.value = '';
    confirm.value = '';
    login.value = '';
    requestError.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<style lang="scss">
@use '@/styles/mixins';

.signup-form {
  @include mixins.flex-col;

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
