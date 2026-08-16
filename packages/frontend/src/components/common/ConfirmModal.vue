<template>
  <BaseModal
    :is-open="isOpen"
    :data-testid="dataTestid"
    :close-on-backdrop="closeOnBackdrop"
    :close-on-esc="closeOnEsc"
    @close="$emit('cancel')"
  >
    <template #header>
      <slot name="title">{{ title }}</slot>
    </template>

    <slot>{{ message }}</slot>

    <template #footer>
      <BaseButton
        size="medium"
        data-testid="confirm-modal-cancel"
        @click="$emit('cancel')"
      >
        {{ cancelLabel }}
      </BaseButton>

      <BaseButton
        size="medium"
        data-testid="confirm-modal-confirm"
        :type="confirmType"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseButton from './BaseButton.vue';
import BaseModal from './BaseModal.vue';

interface Props {
  dataTestid?: string;
  isOpen?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmType?: 'primary' | 'danger' | 'icon';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

interface Emits {
  confirm: [];
  cancel: [];
}

withDefaults(defineProps<Props>(), {
  dataTestid: 'confirm-modal',
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  confirmType: 'danger',
  closeOnBackdrop: true,
  closeOnEsc: true,
});

defineEmits<Emits>();
</script>
