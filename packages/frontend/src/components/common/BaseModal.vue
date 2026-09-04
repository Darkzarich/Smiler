<template>
  <Teleport to="body">
    <Transition name="base-modal">
      <div v-if="isOpen" class="base-modal" :data-testid="dataTestid">
        <button
          type="button"
          class="base-modal__backdrop"
          :data-testid="`${dataTestid}-backdrop`"
          aria-label="Close"
          @click="handleBackdropClick"
        />

        <div
          class="base-modal__panel"
          :data-testid="`${dataTestid}-panel`"
          role="dialog"
          aria-modal="true"
        >
          <header v-if="$slots.header" class="base-modal__header">
            <slot name="header" />
          </header>

          <div class="base-modal__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="base-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';

interface Props {
  isOpen?: boolean;
  dataTestid?: string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}

interface Emits {
  close: [];
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  dataTestid: 'base-modal',
  closeOnBackdrop: true,
  closeOnEsc: true,
});

const emit = defineEmits<Emits>();

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('close');
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (props.closeOnEsc && event.key === 'Escape') {
    emit('close');
  }
};

let previousBodyOverflow = '';

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      window.addEventListener('keydown', handleKeydown);
    } else {
      document.body.style.overflow = previousBodyOverflow;

      window.removeEventListener('keydown', handleKeydown);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow;

  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style>
.base-modal {
  &__backdrop {
    position: fixed;
    z-index: 1000;
    padding: 0;
    border: none;
    background: rgb(0 0 0 / 50%);
    inset: 0;
    cursor: pointer;
  }

  &__panel {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 1001;
    min-width: 300px;
    max-width: calc(100vw - 32px);
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 8px 30px rgb(0 0 0 / 20%);
    background: var(--color-surface-elevated);
    color: var(--color-text-primary);
    transform: translate(-50%, -50%);
  }

  &__header {
    margin-bottom: 16px;
    font-size: 18px;
    font-weight: bold;
  }

  &__body {
    color: var(--color-text-primary);
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }

  &-enter-active,
  &-leave-active {
    transition: opacity 0.2s ease;

    .base-modal__backdrop,
    .base-modal__panel {
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
    }
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;

    .base-modal__panel {
      transform: translate(-50%, -50%) scale(0.95);
    }
  }

  @media (--phone-only) {
    &__panel {
      top: auto;
      bottom: 0;
      left: 0;
      width: 100%;
      max-width: 100%;
      border-radius: 16px 16px 0 0;
      transform: none;
    }

    &-enter-from,
    &-leave-to {
      .base-modal__panel {
        transform: translateY(100%);
      }
    }
  }
}
</style>
