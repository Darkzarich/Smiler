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
        ref="cancelButton"
        size="medium"
        :data-testid="`${dataTestid}-cancel`"
        @click="$emit('cancel')"
      >
        {{ cancelLabel }}
      </BaseButton>

      <BaseButton
        size="medium"
        :data-testid="`${dataTestid}-confirm`"
        :type="confirmType"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue';
import BaseButton from './BaseButton.vue';
import BaseModal from './BaseModal.vue';

interface Props {
  dataTestid?: string;
  isOpen?: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmType?: 'primary' | 'danger';
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

interface Emits {
  confirm: [];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
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

const cancelButton =
  useTemplateRef<InstanceType<typeof BaseButton>>('cancelButton');

// Focus starts on Cancel, the choice that can't lose anything, and goes back to
// whatever opened the dialog once it closes
let returnFocusTo: HTMLElement | null = null;

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      returnFocusTo?.focus();
      returnFocusTo = null;

      return;
    }

    returnFocusTo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    await nextTick();

    (cancelButton.value?.$el as HTMLElement | undefined)?.focus();
  },
);
</script>
