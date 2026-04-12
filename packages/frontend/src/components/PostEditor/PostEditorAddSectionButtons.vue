<template>
  <div class="post-editor-add-section-buttons">
    <button
      type="button"
      class="post-editor-add-section-buttons__button"
      data-testid="add-text-button"
      tabindex="0"
      @focus="preloadTextEditor"
      @pointerenter="preloadTextEditor"
      @click="$emit('add-section', postTypes.POST_SECTION_TYPES.TEXT)"
    >
      <IconText />
    </button>

    <button
      type="button"
      class="post-editor-add-section-buttons__button"
      data-testid="add-pic-button"
      tabindex="0"
      @click="$emit('add-section', postTypes.POST_SECTION_TYPES.PICTURE)"
    >
      <IconPicture />
    </button>

    <button
      type="button"
      class="post-editor-add-section-buttons__button"
      data-testid="add-video-button"
      tabindex="0"
      @click="$emit('add-section', postTypes.POST_SECTION_TYPES.VIDEO)"
    >
      <IconVideo />
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { postTypes } from '@/api/posts';
import { loadBaseTiptapTextEditor } from '@common/base-tiptap-text-editor-loader';
import IconPicture from '@icons/IconPicture.vue';
import IconText from '@icons/IconText.vue';
import IconVideo from '@icons/IconVideo.vue';

defineEmits<{
  'add-section': [postTypes.POST_SECTION_TYPES];
}>();

const preloadTextEditor = () => {
  void loadBaseTiptapTextEditor();
};

onMounted(preloadTextEditor);
</script>

<style lang="scss">
.post-editor-add-section-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;

  &__button {
    padding: 16px;
    border: 2px solid var(--color-text-secondary);
    border-radius: 8px;
    background: var(--color-surface-primary);
    cursor: pointer;
    transition: all 200ms ease-out;

    svg {
      transition: all 200ms ease-out;
      fill: var(--color-text-secondary);
    }

    &:hover {
      border: 2px solid var(--color-primary);

      svg {
        fill: var(--color-primary);
      }
    }
  }
}
</style>
