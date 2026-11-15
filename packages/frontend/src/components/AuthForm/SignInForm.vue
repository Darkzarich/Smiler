<template>
  <form
    class="signin-form u-flex-col"
    data-testid="signin-form"
    @submit.prevent="signIn"
  >
    <div
      v-if="!hideHeader"
      class="signin-form__header"
      data-testid="signin-form-header"
    >
      Sign in
    </div>

    <div class="signin-form__input">
      <BaseInput
        ref="emailInput"
        v-model="email"
        data-testid="signin-form-email"
        label="Email"
        name="email"
        placeholder="Enter email"
        :error="validation.email"
        :show-error="isSubmitted"
      />
    </div>

    <div class="signin-form__input">
      <BaseInput
        ref="passwordInput"
        v-model="password"
        data-testid="signin-form-password"
        label="Password"
        type="password"
        name="password"
        :error="validation.password"
        :show-error="isSubmitted"
        placeholder="Enter password"
      />
    </div>

    <p
      v-if="formError"
      class="signin-form__error"
      role="alert"
      data-testid="signin-form-error"
    >
      {{ formError }}
    </p>

    <BaseButton
      attr-type="submit"
      class="signin-form__submit"
      stretched
      data-testid="signin-form-submit"
      type="primary"
      :loading="isLoading"
    >
      Sign in
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { api, getRequestErrorMessage } from '@/api';
import { isUnauthorizedError } from '@/api/ApiClient';
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

const emailInput = useTemplateRef<InstanceType<typeof BaseInput>>('emailInput');
const passwordInput =
  useTemplateRef<InstanceType<typeof BaseInput>>('passwordInput');

const isLoading = ref(false);
const isSubmitted = ref(false);

const email = ref('');
const password = ref('');

const { formError, refusalOf, refuseField, refuse, reset } = useRefusedFields({
  email,
  password,
});

const validation = computed(() => {
  const validation = {
    email: '',
    password: '',
  };

  if (email.value.length === 0) {
    validation.email = "Email can't be empty";
  } else if (!/^[^@]+@[^@]+\.[^@]+$/gm.test(email.value)) {
    validation.email = 'Email is not valid';
  }

  if (password.value.length === 0) {
    validation.password = "Password can't be empty";
  } else if (password.value.length < consts.PASSWORD_MIN_LENGTH) {
    validation.password = `Password length must be minimum ${consts.PASSWORD_MIN_LENGTH}`;
  }

  for (const field of Object.keys(validation) as (keyof typeof validation)[]) {
    validation[field] = refusalOf(field) || validation[field];
  }

  return validation;
});

const isInvalid = computed(
  () => !!(validation.value.email || validation.value.password),
);

async function signIn() {
  if (isLoading.value) {
    return;
  }

  reset();

  if (isInvalid.value) {
    isSubmitted.value = true;
    (validation.value.email ? emailInput : passwordInput).value?.focus();

    return;
  }

  try {
    isLoading.value = true;

    const data = await api.auth.signIn(
      {
        email: email.value,
        password: password.value,
      },
      { notifyOnError: false },
    );

    userStore.setUser(data);
  } catch (error) {
    isSubmitted.value = true;

    // The API does not say which of the two was wrong, so the email stays for
    // another try and only the password is typed again
    if (isUnauthorizedError(error)) {
      password.value = '';
      refuseField(
        'password',
        getRequestErrorMessage(error) ?? 'Invalid email or password',
      );
      passwordInput.value?.focus();

      return;
    }

    const field = refuse(error, 'Could not sign in. Please try again.');

    if (field) {
      (field === 'email' ? emailInput : passwordInput).value?.focus();
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<style>
.signin-form {
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
