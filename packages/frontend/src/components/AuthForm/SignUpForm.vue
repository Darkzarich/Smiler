<template>
  <form
    class="signup-form u-flex-col"
    data-testid="signup-form"
    @submit.prevent="signUp"
  >
    <div
      v-if="!hideHeader"
      class="signup-form__header"
      data-testid="signup-form-header"
    >
      Sign up
    </div>

    <div class="signup-form__input">
      <BaseInput
        ref="emailInput"
        v-model="email"
        data-testid="signup-form-email"
        label="Email"
        name="email"
        placeholder="Enter email"
        :error="validation.email"
        :show-error="isSubmitted"
      />
    </div>

    <div class="signup-form__input">
      <BaseInput
        ref="loginInput"
        v-model="login"
        data-testid="signup-form-login"
        label="Login"
        name="login"
        placeholder="Enter login"
        :error="validation.login"
        :show-error="isSubmitted"
      />
    </div>

    <div class="signup-form__input">
      <BaseInput
        ref="passwordInput"
        v-model="password"
        data-testid="signup-form-password"
        label="Password"
        :type="'password'"
        name="password"
        :error="validation.password"
        :show-error="isSubmitted"
        placeholder="Enter password"
      />
    </div>

    <div class="signup-form__input">
      <BaseInput
        ref="confirmInput"
        v-model="confirm"
        data-testid="signup-form-confirm"
        label="Confirm password"
        type="password"
        name="confirm"
        :error="validation.confirm"
        :show-error="isSubmitted"
        placeholder="Enter password again"
      />
    </div>

    <p
      v-if="formError"
      class="signup-form__error"
      role="alert"
      data-testid="signup-form-error"
    >
      {{ formError }}
    </p>

    <BaseButton
      attr-type="submit"
      class="signup-form__submit"
      stretched
      data-testid="signup-form-submit"
      type="primary"
      :loading="isLoading"
    >
      Create account
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { api } from '@/api';
import * as consts from '@/const';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import { useRefusedFields } from './use-refused-fields';

interface Props {
  /** For a dialog whose own title already says what the form is for */
  hideHeader?: boolean;
}

defineProps<Props>();

const userStore = useUserStore();

const email = ref('');
const login = ref('');
const password = ref('');
const confirm = ref('');
const isLoading = ref(false);
const isSubmitted = ref(false);

// In the order of the form, so the first one with an error gets the focus
const inputs = {
  email: useTemplateRef<InstanceType<typeof BaseInput>>('emailInput'),
  login: useTemplateRef<InstanceType<typeof BaseInput>>('loginInput'),
  password: useTemplateRef<InstanceType<typeof BaseInput>>('passwordInput'),
  confirm: useTemplateRef<InstanceType<typeof BaseInput>>('confirmInput'),
};

const { formError, refusalOf, refuse, reset } = useRefusedFields({
  email,
  login,
  password,
  confirm,
});

const validation = computed(() => {
  const validation = {
    email: '',
    login: '',
    confirm: '',
    password: '',
  };

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

  for (const field of Object.keys(validation) as (keyof typeof validation)[]) {
    validation[field] = refusalOf(field) || validation[field];
  }

  return validation;
});

const isInvalid = computed(() => {
  return Boolean(
    validation.value.email ||
      validation.value.password ||
      validation.value.confirm ||
      validation.value.login,
  );
});

async function signUp() {
  if (isLoading.value) {
    return;
  }

  reset();

  if (isInvalid.value) {
    isSubmitted.value = true;

    const field = (Object.keys(inputs) as (keyof typeof inputs)[]).find(
      (key) => validation.value[key],
    );

    if (field) {
      inputs[field].value?.focus();
    }

    return;
  }

  try {
    isLoading.value = true;

    const data = await api.auth.signUp(
      {
        email: email.value,
        password: password.value,
        login: login.value,
        confirm: confirm.value,
      },
      { notifyOnError: false },
    );

    userStore.setUser(data);
  } catch (error) {
    isSubmitted.value = true;

    const field = refuse(error, 'Could not sign up. Please try again.');

    if (field) {
      inputs[field].value?.focus();
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<style>
.signup-form {
  align-items: center;

  &__header {
    margin-bottom: 0.5rem;
    color: var(--color-text-primary);
    font-weight: bold;
  }

  &__input {
    width: 100%;
    margin-bottom: 16px;
  }

  &__error {
    width: 100%;
    margin: 0;
    color: var(--color-danger-strong);
    font-size: 13px;
  }

  &__submit {
    margin-top: 8px;
  }
}
</style>
