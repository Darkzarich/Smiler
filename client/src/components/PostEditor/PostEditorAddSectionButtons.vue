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
import consts from '@/const/const';
import IconPicture from '@icons/IconPicture.vue';
import IconText from '@icons/IconText.vue';
import IconVideo from '@icons/IconVideo.vue';

export default {
  components: {
    IconPicture,
    IconText,
    IconVideo,
  },
  data() {
    return {
      POST_SECTION_TYPES: consts.POST_SECTION_TYPES,
    };
  },
};
</script>

<style lang="scss">
.post-editor-add-section-buttons {
  display: flex;
  justify-content: center;

  &__button {
    margin-left: 1rem;
    padding: 1rem;
    border: 1px solid var(--color-gray-light);
    background: var(--color-bg);
    cursor: pointer;

    &:hover {
      background: var(--color-widget-bg);
    }

    svg {
      fill: var(--color-gray-light);
    }
  }
}
</style>
