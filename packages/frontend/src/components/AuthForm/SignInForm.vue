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

<script setup lang="ts">
import { computed, ref } from 'vue';
import { api } from '@/api';
import * as consts from '@/const';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';

const userStore = useUserStore();

const isLoading = ref(false);
const requestError = ref('');

const email = ref('');
const password = ref('');

const validation = computed(() => {
  const validation = {
    email: '',
    password: '',
  };

  if (requestError.value && !(password.value || email.value)) {
    validation.email = requestError.value;
    validation.password = requestError.value;
  } else {
    requestError.value = '';

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
  }

  return validation;
});

const isSubmitDisabled = computed(
  () => !!(validation.value.email || validation.value.password),
);

async function signIn() {
  if (isSubmitDisabled.value || isLoading.value) {
    return;
  }

  try {
    isLoading.value = true;

    const data = await api.auth.signIn({
      email: email.value,
      password: password.value,
    });

    userStore.user = data;
  } catch (e) {
    const error = e as Error;

    email.value = '';
    password.value = '';
    requestError.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
</script>

<style lang="scss">
@use '@/styles/mixins';

.signin-form {
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
