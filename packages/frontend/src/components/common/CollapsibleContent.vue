<template>
  <div class="collapsible-content">
    <div
      ref="bodyRef"
      class="collapsible-content__body"
      data-testid="collapsible-content-body"
      :class="{ 'collapsible-content__body--collapsed': isCollapsed }"
      :style="collapsedStyle"
    >
      <slot />
    </div>
    <div
      v-if="isCollapsed"
      class="collapsible-content__fade"
      data-testid="collapsible-content-fade"
    />
    <button
      v-if="needsCollapsing"
      class="collapsible-content__toggle"
      data-testid="collapsible-content-toggle"
      @click="toggle"
    >
      {{ isCollapsed ? 'Read more' : 'Show less' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface Props {
  maxHeight?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: 400,
  disabled: false,
});

const bodyRef = ref<HTMLElement | null>(null);
const needsCollapsing = ref(false);
const isCollapsed = ref(false);

const collapsedStyle = computed(() =>
  isCollapsed.value ? { maxHeight: `${props.maxHeight}px` } : undefined,
);

let observer: ResizeObserver | null = null;

function measure() {
  if (!bodyRef.value) {
    return;
  }
  const height = bodyRef.value.scrollHeight;
  if (height > props.maxHeight) {
    const wasAlreadyMeasured = needsCollapsing.value;
    needsCollapsing.value = true;
    if (!wasAlreadyMeasured) {
      isCollapsed.value = true;
    }
  } else {
    needsCollapsing.value = false;
    isCollapsed.value = false;
  }
}

function toggle() {
  isCollapsed.value = !isCollapsed.value;
}

watch(
  () => props.disabled,
  (val) => {
    if (val) {
      needsCollapsing.value = false;
      isCollapsed.value = false;
    } else {
      measure();
    }
  },
);

onMounted(() => {
  if (!props.disabled && bodyRef.value) {
    observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(bodyRef.value);
    measure();
  }
});

onUnmounted(() => {
  observer?.disconnect();
});

defineExpose({ measure });
</script>

<style lang="scss" scoped>
.collapsible-content {
  &__body--collapsed {
    overflow: hidden;
  }

  &__fade {
    position: relative;
    height: 80px;
    margin-top: -80px;
    background: linear-gradient(
      to bottom,
      transparent,
      var(--color-surface-secondary)
    );
    pointer-events: none;
  }

  &__toggle {
    display: block;
    width: 100%;
    padding: 0;
    border: none;
    border-bottom: 1px solid transparent;
    background: none;
    color: var(--color-primary);
    font-size: 13px;
    cursor: pointer;

    &:hover {
      border-bottom-color: var(--color-primary);
    }
  }
}
</style>
