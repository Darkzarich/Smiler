<template>
  <div ref="root" class="base-upload-form u-flex-col">
    <label
      class="base-upload-form__label"
      :class="{
        'base-upload-form__label--dragging': isOverDropZone,
        'base-upload-form__label--dragging-quiet':
          isOverDropZone && hasHostZone,
        'base-upload-form__label--disabled': disabled,
      }"
      :for="id"
    >
      <template v-if="isPointerCoarse">
        <span>Upload image</span>
      </template>

      <template v-else>
        <IconPicture class="base-upload-form__icon" />

        <span class="base-upload-form__title"
          >Drag &amp; drop an image here</span
        >

        <span class="base-upload-form__hint">or click to choose a file</span>
      </template>

      <input
        :id="id"
        class="base-upload-form__input"
        type="file"
        aria-label="Upload image"
        :accept="accept?.join(',')"
        :disabled="disabled"
        @input="handleInput"
        @change="handleInput"
      />
    </label>
  </div>
</template>

<script setup lang="ts">
import { useDropZone } from '@vueuse/core';
import { computed, useTemplateRef, watch } from 'vue';
import { useMediaQuery } from '@/composables/use-media-query';
import IconPicture from '@icons/IconPicture.vue';

interface Props {
  /** Mime types this takes. They go on the input's `accept` for the file dialog
   * and are matched against a dragged item's type, so the same list decides
   * both ways in. */
  accept?: string[];
  disabled?: boolean;
  /** The element that takes the drop, when it should be larger than this
   * component - a form sitting among other controls can hand in the section
   * around it so the whole thing is one target. Defaults to this component. */
  dropZone?: HTMLElement | null;
}

const props = withDefaults(defineProps<Props>(), {
  accept: undefined,
  disabled: false,
  dropZone: undefined,
});

interface Emits {
  select: [File];
}

const emit = defineEmits<Emits>();

/** Only ever written here — whoever owns a larger drop zone needs the state to
 * highlight it, and cannot get it from the DOM. */
const draggingOver = defineModel<boolean>('draggingOver', { default: false });

/** Dragging a file is a pointer gesture, so a touch screen is offered the plain
 * button instead of an instruction it cannot follow. */
const isPointerCoarse = useMediaQuery('pointer-coarse');

const id = crypto.randomUUID();

const root = useTemplateRef<HTMLElement>('root');

const hasHostZone = computed(() => props.dropZone !== undefined);

/** A touch screen cannot drag a file in, and an upload already in flight should
 * not be joined by a second one. `useDropZone` follows its target, so resolving
 * to null takes the listeners off with it. */
const dropZoneTarget = computed(() => {
  if (isPointerCoarse.value || props.disabled) {
    return null;
  }

  return hasHostZone.value ? props.dropZone : root.value;
});

/** The allow-list is matched against the dragged item's type, so a file the
 * form would refuse anyway — or anything that is not a file at all, such as a
 * draggable element carrying text — never even highlights the zone. */
const { isOverDropZone } = useDropZone(dropZoneTarget, {
  dataTypes: computed(() => props.accept ?? []),
  multiple: false,
  onDrop: (files) => {
    const file = files?.[0];

    if (file) {
      emit('select', file);
    }
  },
});

watch(isOverDropZone, (value) => {
  draggingOver.value = value;
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;

  const file = target.files?.[0];

  if (!file) {
    return;
  }

  // Picking the same file twice fires no `change` unless the value is cleared,
  // and after a rejected or a failed upload that is exactly what one does.
  target.value = '';

  emit('select', file);
};
</script>

<style>
.base-upload-form {
  &__label {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 1rem;
    border: 2px dashed var(--color-border);
    border-radius: 3px;
    background: var(--color-surface-primary);
    color: var(--color-text-primary);
    text-align: center;
    cursor: pointer;
    transition:
      border-color 0.15s ease,
      background 0.15s ease;

    /* A file cannot be dragged onto this without hovering it, and the hover
       affordance would otherwise outrank the drag state and keep its border. */
    &:hover:not(.base-upload-form__label--dragging) {
      border-color: var(--color-border-hover);
    }

    &--dragging {
      border-style: solid;
      border-color: var(--color-primary);
      background: var(--color-accent-transparent);
    }

    /* A host zone reaches past this component and paints the highlight itself.
       Two nested outlines read as two targets, so this one steps back and lets
       the region around it carry the state — after the rule it overrides. */
    &--dragging-quiet {
      border-color: transparent;
      background: transparent;
    }

    &--disabled {
      color: var(--color-text-disabled);
      cursor: default;
      pointer-events: none;
    }

    /* Touch keeps the solid button it has always had — there is nothing to drag. */
    @media (--pointer-coarse) {
      border-style: solid;
      border-color: var(--color-text-secondary);
    }
  }

  &__icon {
    fill: var(--color-text-secondary);
  }

  &__hint {
    color: var(--color-text-secondary);
    font-size: 14px;
  }

  &__input {
    position: absolute;
    opacity: 0;
    outline: 0;
    pointer-events: none;
    user-select: none;
  }
}
</style>
