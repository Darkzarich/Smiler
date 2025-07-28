<template>
  <div class="post-editor">
    <BaseInput
      v-model="title"
      class="post-editor__title"
      data-testid="post-title-input"
      :placeholder="'Title'"
      :error="validation.title"
    />

    <PostEditorTags v-model:tags="tags" class="post-editor__tags" />

    <Draggable
      :list="sections"
      :animation="200"
      ghost-class="post-editor__section--moving"
      chosen-class="post-editor__section--chosen"
      :component-data="{
        name: 'post-editor__section',
        tag: 'div',
        'data-testid': 'post-sections',
      }"
      item-key="hash"
      tag="transition-group"
    >
      <template #item="{ element: section }">
        <div class="post-editor__section" data-testid="post-section">
          <!-- TODO: Refactor this part -->
          <template v-if="section.type === postTypes.POST_SECTION_TYPES.TEXT">
            <BaseTextEditor
              :id="section.hash"
              v-model="section.content"
              data-testid="text-section"
            />
          </template>

          <template
            v-else-if="section.type === postTypes.POST_SECTION_TYPES.PICTURE"
          >
            <PostEditorPicture
              v-model="section.url"
              data-testid="pic-section"
              @update-section="updatePictureSection"
            />
          </template>

          <template
            v-else-if="section.type === postTypes.POST_SECTION_TYPES.VIDEO"
          >
            <PostEditorVideo
              v-model="section.url"
              data-testid="video-section"
            />
          </template>

          <button
            type="button"
            class="post-editor__delete-btn"
            @click="deleteSection(section)"
          >
            <CloseIcon
              title="Delete"
              :data-testid="`delete-section-${section.hash}`"
            />
          </button>
        </div>
      </template>
    </Draggable>

    <PostEditorAddSectionButtons
      v-if="sections.length < consts.POST_MAX_SECTIONS"
      class="post-editor__add-section-buttons"
      @add-section="createSection"
    />

    <div class="post-editor__submit-form">
      <template v-if="isEdit">
        <BaseButton
          class="post-editor__submit-form-btn"
          data-testid="finish-edit-post-button"
          :loading="isSaving"
          :disabled="!sections.length"
          @click="saveEdited"
        >
          Save Edited
        </BaseButton>
      </template>

      <template v-else>
        <BaseButton
          class="post-editor__submit-form-btn"
          stretched
          data-testid="create-post-button"
          :loading="isSending"
          :disabled="isSubmitDisabled"
          @click="createPost"
        >
          Create Post
        </BaseButton>
        <BaseButton
          stretched
          class="post-editor__submit-form-btn"
          data-testid="save-draft-button"
          :loading="isSaving"
          :disabled="!isDirty"
          @click="saveDraft"
        >
          Save Draft
        </BaseButton>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Draggable from 'vuedraggable';
import {
  isPictureSection,
  isTextSection,
  isVideoSection,
} from '../Post/is-section-of-type';
import PostEditorAddSectionButtons from './PostEditorAddSectionButtons.vue';
import PostEditorPicture from './PostEditorPicture.vue';
import PostEditorTags from './PostEditorTags.vue';
import PostEditorVideo from './PostEditorVideo.vue';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import * as consts from '@/const';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';
import CloseIcon from '@icons/IconExit.vue';

const router = useRouter();

const userStore = useUserStore();

const notificationsStore = useNotificationsStore();

interface Props {
  isEdit: boolean;
  post: postTypes.Post | null;
}

const props = defineProps<Props>();

const isSending = ref(false);

const isSaving = ref(false);

// Post fields
const title = ref('');
const tags = ref<string[]>([]);
const sections = ref<postTypes.PostSection[]>([]);

const isDirty = ref(false);

const validation = computed(() => {
  const validation = {
    title: '',
    sections: '',
  };

  // title
  if (title.value.length === 0) {
    validation.title = "Title can't be empty";
  }

  if (title.value.length > consts.POST_TITLE_MAX_LENGTH) {
    validation.title = `Title can't be longer than ${consts.POST_TITLE_MAX_LENGTH} symbols`;
  }

  // sections
  if (!sections.value.length) {
    validation.sections = 'You should add at least one section';
  }

  return validation;
});

watch(
  [title, tags, sections],
  () => {
    isDirty.value = true;
  },
  { deep: true },
);

const isSubmitDisabled = computed(() => {
  return Boolean(validation.value.title || validation.value.sections);
});

const createSection = (type: postTypes.POST_SECTION_TYPES) => {
  const base = {
    type,
    hash: (Math.random() * Math.random()).toString(36),
  } as postTypes.PostSection;

  if (isPictureSection(base)) {
    base.url = '';
  }

  if (isVideoSection(base)) {
    base.url = '';
  }

  if (isTextSection(base)) {
    base.content = '';
  }

  sections.value.push(base);
};

const updatePictureSection = (data: postTypes.PostPictureSection) => {
  const currentSection = sections.value.find(
    (section) => isPictureSection(section) && section.url === data.url,
  );

  if (!currentSection) {
    return;
  }

  const currentSectionIndex = sections.value.indexOf(currentSection);

  sections.value[currentSectionIndex] = data;
};

const deleteSection = (section: postTypes.PostSection) => {
  if (section.type === postTypes.POST_SECTION_TYPES.PICTURE && section.isFile) {
    api.users.removeFilePicSection(section.hash);
  }

  sections.value.splice(sections.value.indexOf(section), 1);
};

onMounted(async () => {
  if (props.isEdit && props.post) {
    sections.value = props.post.sections;
    title.value = props.post.title;
    tags.value = props.post.tags;
  } else {
    if (!userStore.userId) {
      return;
    }

    const data = await api.users.getUserTemplate(userStore.userId);

    title.value = data.title;
    sections.value = data.sections || [];
    tags.value = data.tags || [];
  }

  nextTick(() => {
    isDirty.value = false;
  });
});

const createPost = async () => {
  try {
    isSending.value = true;

    const data = await api.posts.createPost({
      sections: sections.value,
      title: title.value,
      tags: tags.value,
    });

    router.push({
      name: 'Single',
      params: {
        slug: data.slug,
      },
    });
  } finally {
    isSending.value = false;
  }
};

const saveEdited = async () => {
  if (!props.post) {
    return;
  }

  await api.posts.updatePostById(props.post.id, {
    title: title.value,
    sections: sections.value,
    tags: tags.value,
  });

  notificationsStore.showInfoNotification({
    message: 'Post has been saved successfully',
  });

  router.push({
    name: 'Single',
    params: {
      slug: props.post.slug,
    },
  });
};

const saveDraft = async () => {
  try {
    isSaving.value = true;

    const data = await api.users.updateUserTemplate(userStore.userId!, {
      title: title.value,
      sections: sections.value,
      tags: tags.value,
    });

    title.value = data.title;
    sections.value = data.sections;
    tags.value = data.tags;

    notificationsStore.showInfoNotification({
      message: 'Draft post has been saved successfully!',
    });

    nextTick(() => {
      isDirty.value = false;
    });
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.post-editor {
  &__title {
    margin-bottom: 12px;
    font-size: 20px;
  }

  &__tags {
    margin-bottom: 16px;
  }

  &__section {
    @include mixins.flex-row;

    align-items: center;
    position: relative;
    margin-bottom: 32px;
    cursor: move;

    .base-text-editor {
      border: 1px solid var(--color-gray-light);
      border-radius: 8px;

      @include mixins.for-size(phone-only) {
        border-right: none;
        border-left: none;
        border-radius: 0;
      }
    }

    &:last-child {
      margin-bottom: 0;
    }

    &--moving {
      opacity: 0.4;
    }

    &--chosen {
      .base-text-editor,
      .post-editor-picture,
      .post-editor-video {
        border: 1px solid var(--color-primary);
      }
    }

    &-enter-active,
    &-leave-active {
      transition: all 0.3s;
    }

    &-enter-from,
    &-leave-to {
      opacity: 0;
      transform: translateY(15px);
    }
  }

  &__delete-btn {
    position: absolute;
    right: -20px;
    padding: 0;
    border: none;
    background-color: transparent;

    @include mixins.for-size(phone-only) {
      top: -14px;
      right: 12px;
      width: 10px;
    }

    &:hover {
      filter: brightness(120%);
    }

    svg {
      cursor: pointer;
      transition: fill 0.3s ease-in-out;
      fill: var(--color-danger);
    }
  }

  &__add-section-buttons {
    margin: 32px;
  }

  &__submit-form {
    display: flex;
    justify-content: space-around;
    gap: 16px;
  }
}
</style>
