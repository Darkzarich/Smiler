<template>
  <div class="post-spoiler" :class="{ 'post-spoiler--hidden': isHidden }">
    <div
      class="post-spoiler__content"
      :data-testid="contentTestId"
      :inert="isHidden || undefined"
      :aria-hidden="isHidden || undefined"
    >
      <slot />
    </div>

    <Transition name="post-spoiler__veil">
      <button
        v-if="isHidden"
        type="button"
        class="post-spoiler__veil"
        :data-testid="testId"
        aria-label="Reveal hidden content"
        @click="isRevealed = true"
      >
        <span class="post-spoiler__badge">
          <IconEye />
          <span class="post-spoiler__badge-text">
            <span class="post-spoiler__badge-title">Spoiler</span>
            <span class="post-spoiler__badge-hint">Click to reveal</span>
          </span>
        </span>
      </button>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import IconEye from '@icons/IconEye.vue';

interface Props {
  isSpoiler?: boolean;
  testId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isSpoiler: false,
  testId: undefined,
});

const isRevealed = ref(false);

const contentTestId = computed(() =>
  props.testId ? `${props.testId}-content` : undefined,
);

const isHidden = computed(() => props.isSpoiler && !isRevealed.value);
</script>

<style>
.post-spoiler {
  position: relative;

  &--hidden {
    min-height: 5.5rem;

    .post-spoiler__content {
      user-select: none;
    }
  }

  &__veil {
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    background: var(--color-spoiler-veil);
    inset: 0;
    cursor: pointer;
    transition: background 300ms ease-out;
    backdrop-filter: blur(14px) saturate(60%);

    &:hover,
    &:focus-visible {
      background: var(--color-spoiler-veil-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: -2px;
    }

    @supports not (backdrop-filter: blur(1px)) {
      background: var(--color-spoiler-veil-solid);
    }

    &-leave-active {
      transition:
        opacity 450ms ease-out,
        backdrop-filter 450ms ease-out;
    }

    &-leave-to {
      opacity: 0;
      backdrop-filter: blur(0) saturate(100%);
    }
  }

  &__badge {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    box-shadow: 0 2px 12px rgb(0 0 0 / 15%);
    background: var(--color-surface-secondary);
    color: var(--color-text-primary);
    transition:
      opacity 300ms ease-out,
      transform 300ms ease-out;

    svg {
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      fill: var(--color-primary);
    }
  }

  &__veil-leave-to &__badge {
    opacity: 0;
    transform: scale(1.15);
  }

  &__veil:hover &__badge {
    transform: translateY(-2px);
  }

  &__badge-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.2;
  }

  &__badge-title {
    font-size: 0.9rem;
    font-weight: bold;
  }

  &__badge-hint {
    color: var(--color-text-secondary);
    font-size: 0.75rem;
  }

  @media (prefers-reduced-motion: reduce) {
    &__veil,
    &__veil-leave-active,
    &__badge {
      transition: none;
    }
  }
}
</style>
