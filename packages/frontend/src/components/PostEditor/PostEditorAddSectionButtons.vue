<template>
  <div class="post-editor-add-section-buttons">
    <BaseButton
      v-for="button in buttons"
      :key="button.type"
      class="post-editor-add-section-buttons__button"
      :data-testid="button.dataTestid"
      :aria-label="button.name"
      :title="button.name"
      @focus="button.preload?.()"
      @pointerenter="button.preload?.()"
      @click="$emit('add-section', button.type)"
    >
      <component :is="sectionKinds[button.type].icon" />
      {{ sectionKinds[button.type].label }}
    </BaseButton>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { sectionKinds } from './section-kinds';
import { postTypes } from '@/api/posts';
import BaseButton from '@common/BaseButton.vue';
import { loadBaseTiptapTextEditor } from '@common/base-tiptap-text-editor-loader';

defineEmits<{
  'add-section': [postTypes.POST_SECTION_TYPES];
}>();

const preloadTextEditor = () => {
  void loadBaseTiptapTextEditor();
};

const buttons = [
  {
    type: postTypes.POST_SECTION_TYPES.TEXT,
    dataTestid: 'add-text-button',
    preload: preloadTextEditor,
  },
  {
    type: postTypes.POST_SECTION_TYPES.PICTURE,
    dataTestid: 'add-pic-button',
  },
  {
    type: postTypes.POST_SECTION_TYPES.VIDEO,
    dataTestid: 'add-video-button',
  },
].map((button) => ({
  ...button,
  name: `Add ${sectionKinds[button.type].label.toLowerCase()}`,
}));

onMounted(preloadTextEditor);
</script>

<style>
.post-editor-add-section-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;

  &__button {
    gap: 8px;
    padding-inline: 16px;

    svg {
      flex: none;
      width: 18px;
      height: 18px;
      fill: var(--color-text-secondary);
    }

    @media (--phone-only) {
      flex: 1 1 0;
      padding-inline: 8px;
    }
  }
}
</style>
