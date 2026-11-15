<template>
  <div class="post-editor-tags u-flex-row">
    <div
      v-if="tags.length"
      class="post-editor-tags__list"
      data-testid="post-tags-list"
    >
      <BaseTag v-for="tag in tags" :key="tag">
        {{ tag }}
        <template #action>
          <BaseIconButton
            :label="`Remove tag ${tag}`"
            :data-testid="`remove-tag-button-${tag}`"
            size="xsmall"
            tone="danger"
            @click="removeTag(tag)"
          >
            <IconClose />
          </BaseIconButton>
        </template>
      </BaseTag>
    </div>

    <div
      v-if="tags.length < consts.POST_MAX_TAGS"
      class="post-editor-tags__form"
    >
      <BaseInput
        ref="input"
        v-model="tagInput"
        data-testid="post-tag-input"
        placeholder="Input up to 8 tags"
        :error="tagInputError"
        @keyup.enter="addTag"
        @keydown="addTagOnComma"
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
import { computed, ref, useTemplateRef, watch } from 'vue';
import * as consts from '@/const';
import BaseIconButton from '@common/BaseIconButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseTag from '@common/BaseTag.vue';
import IconAdd from '@icons/IconAdd.vue';
import IconClose from '@icons/IconClose.vue';
import { normalizeTag } from '@utils/normalize-tag';

interface Props {
  dataTestid?: string;
}

defineProps<Props>();

const tags = defineModel<string[]>('tags', {
  required: true,
});

const input = useTemplateRef<InstanceType<typeof BaseInput>>('input');

const tagInput = ref('');

const pendingTag = computed(() => normalizeTag(tagInput.value));

const isPendingTaken = computed(() =>
  tags.value.some((tag) => normalizeTag(tag) === pendingTag.value),
);

const isAddAttempted = ref(false);

watch(tagInput, () => {
  isAddAttempted.value = false;
});

const tagInputError = computed(() => {
  if (pendingTag.value.length > consts.POST_MAX_TAG_LEN) {
    return `Tag can't be longer than ${consts.POST_MAX_TAG_LEN}`;
  }

  // Only once it was offered as a tag: a "#" on its way to "#hash" is not a
  // mistake yet
  if (!isAddAttempted.value || !tagInput.value.trim()) {
    return '';
  }

  if (!pendingTag.value) {
    return 'Tags are made of letters and numbers';
  }

  if (isPendingTaken.value) {
    return `“${pendingTag.value}” is already added`;
  }

  return '';
});

/** False when the text in the field can't become a tag; it stays there with the reason */
const addTag = () => {
  if (!tagInput.value.trim()) {
    tagInput.value = '';

    return true;
  }

  isAddAttempted.value = true;

  if (tagInputError.value) {
    return false;
  }

  tags.value.push(pendingTag.value);
  tagInput.value = '';

  return true;
};

const addTagOnComma = (event: KeyboardEvent) => {
  if (event.key !== ',') {
    return;
  }

  event.preventDefault();
  addTag();
};

const removeTag = (tag: string) => {
  const tagIndex = tags.value.indexOf(tag);

  if (tagIndex === -1) {
    return;
  }

  tags.value.splice(tagIndex, 1);
};

defineExpose({
  /** For a form being sent: takes in what is still in the field. A tag that is
   * already there is dropped, since the post has it anyway. */
  addPendingTag: () => {
    if (isPendingTaken.value) {
      tagInput.value = '';

      return true;
    }

    return addTag();
  },
  focus: () => input.value?.focus(),
});
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

  &__form {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
