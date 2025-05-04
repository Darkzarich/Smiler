<template>
  <div class="post-editor-add-section-buttons">
    <button
      type="button"
      class="post-editor-add-section-buttons__button"
      data-testid="add-text-button"
      tabindex="0"
      @click="$emit('add-section-by-type', POST_SECTION_TYPES.TEXT)"
    >
      <IconText />
    </button>

    <button
      type="button"
      class="post-editor-add-section-buttons__button"
      data-testid="add-pic-button"
      tabindex="0"
      @click="$emit('add-section-by-type', POST_SECTION_TYPES.PICTURE)"
    >
      <IconPicture />
    </button>

    <button
      type="button"
      class="post-editor-add-section-buttons__button"
      data-testid="add-video-button"
      tabindex="0"
      @click="$emit('add-section-by-type', POST_SECTION_TYPES.VIDEO)"
    >
      <IconVideo />
    </button>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import consts from '@/const/const';
import IconPicture from '@icons/IconPicture.vue';
import IconText from '@icons/IconText.vue';
import IconVideo from '@icons/IconVideo.vue';

export default defineComponent({
  components: {
    IconPicture,
    IconText,
    IconVideo,
  },
  emits: ['add-section-by-type'],
  data() {
    return {
      POST_SECTION_TYPES: consts.POST_SECTION_TYPES,
    };
  },
});
</script>

<style lang="scss">
.post-editor-add-section-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;

  &__button {
    padding: 16px;
    border: 2px solid var(--color-gray-light);
    border-radius: 8px;
    background: var(--color-bg);
    cursor: pointer;
    transition: all 200ms ease-out;

    svg {
      transition: all 200ms ease-out;
      fill: var(--color-gray-light);
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
