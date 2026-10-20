<template>
  <div class="post-editor-tags u-flex-row">
    <div
      v-if="tags.length"
      class="post-editor-tags__list"
      data-testid="post-tags-list"
    >
      <div v-for="tag in tags" :key="tag" class="post-editor-tags__item">
        {{ tag }}
        <BaseIconButton
          :label="`Remove tag ${tag}`"
          :data-testid="`remove-tag-button-${tag}`"
          size="xsmall"
          tone="danger"
          @click="removeTag(tag)"
        >
          <IconClose />
        </BaseIconButton>
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

      <BaseIconButton
        v-if="tagInput.length > 0"
        label="Add tag"
        data-testid="add-tag-button"
        tone="primary"
        @click="addTag"
      >
        <IconAdd />
      </BaseIconButton>
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO: This can be a BasicElements
import { computed, ref } from 'vue';
import * as consts from '@/const';
import BaseIconButton from '@common/BaseIconButton.vue';
import BaseInput from '@common/BaseInput.vue';
import IconAdd from '@icons/IconAdd.vue';
import IconClose from '@icons/IconClose.vue';

interface Props {
  dataTestid?: string;
}

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

<style>
.post-editor-tags {
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
    gap: 2px;
    padding: 2px 2px 2px 6px;
    border: 1px solid var(--color-primary);
    border-radius: 5px;
    background: transparent;
    color: var(--color-primary-strong);
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: bold;
    user-select: none;
  }

  &__form {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
