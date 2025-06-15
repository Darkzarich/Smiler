<template>
  <div class="post-editor-tags">
    <div
      v-if="tags.length"
      class="post-editor-tags__list"
      data-testid="post-tags-list"
    >
      <div v-for="tag in tags" :key="tag" class="post-editor-tags__item">
        {{ tag }}
        <button
          type="button"
          :data-testid="`remove-tag-button-${tag}`"
          class="post-editor-tags__ghost-btn post-editor-tags__remove-tag-btn"
          @click="removeTag(tag)"
        >
          x
        </button>
      </div>
    </div>

    <div
      v-if="tags.length < consts.POST_MAX_TAGS"
      class="post-editor-tags__form"
    >
      <BaseInput
        v-model="tagInput"
        data-testid="post-tag-input"
        placeholder="Input up to 8 tags"
        :error="tagInputValidation"
        @keyup.enter="addTag"
      />

      <!-- TODO: Think of a component for this -->
      <button
        v-if="tagInput.length > 0"
        type="button"
        class="post-editor-tags__ghost-btn post-editor-tags__add-tag-btn"
        @click="addTag"
      >
        +
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: This can be a BasicElements
import { computed, ref } from 'vue';
import * as consts from '@/const';
import BaseInput from '@common/BaseInput.vue';

type Props = {
  dataTestid?: string;
};

defineProps<Props>();

const tags = defineModel<string[]>('tags', {
  required: true,
});

const tagInput = ref('');

const tagInputValidation = computed(() => {
  if (tagInput.value.length > consts.POST_MAX_TAG_LEN) {
    return `Tag can't be longer than ${consts.POST_MAX_TAG_LEN}`;
  }

  return '';
});

const addTag = () => {
  if (!tagInput.value.length) {
    return;
  }

  const checkDouble = tags.value.find((el) => el === tagInput.value);

  if (!checkDouble && !tagInputValidation.value) {
    tags.value.push(tagInput.value);
    tagInput.value = '';
  }
};

const removeTag = (tag: string) => {
  const tagIndex = tags.value.indexOf(tag);

  if (tagIndex === -1) {
    return;
  }

  tags.value.splice(tagIndex, 1);
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.post-editor-tags {
  @include mixins.flex-row;

  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  &__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  &__item {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px 4px;
    border: 1px solid var(--color-primary);
    border-radius: 5px;
    background: transparent;
    color: var(--color-primary);
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: bold;
    user-select: none;
  }

  &__form {
    display: flex;
    align-items: center;
  }

  &__ghost-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    background-color: transparent;
    font-size: 1.5rem;
    user-select: none;
    cursor: pointer;
  }

  &__add-tag-btn {
    color: var(--color-primary);
  }

  &__remove-tag-btn {
    color: var(--color-danger);
    font-size: 0.8rem;
  }
}
</style>
