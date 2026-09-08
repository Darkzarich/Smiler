<template>
  <div class="post-editor">
    <BaseSegmentedControl
      v-model="mode"
      class="post-editor__mode"
      label="Editor mode"
      :options="modeOptions"
    />

    <!-- Hidden rather than unmounted so the tiptap instances survive a preview -->
    <div v-show="!isPreview" class="post-editor__write">
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
        :force-fallback="true"
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
          <div
            class="post-editor__section u-flex-row"
            :class="{ 'post-editor__section--spoiler': section.isSpoiler }"
            data-testid="post-section"
          >
            <span
              v-if="section.isSpoiler"
              class="post-editor__spoiler-badge"
              :data-testid="`spoiler-badge-${section.hash}`"
            >
              <IconEyeOff />
              Spoiler
            </span>

            <!-- TODO: Refactor this part -->
            <template v-if="section.type === postTypes.POST_SECTION_TYPES.TEXT">
              <BaseTextEditor
                :id="section.hash"
                v-model="section.content"
                data-testid="text-section"
                :features="TextEditorFeatures.Post"
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

            <div class="post-editor__section-actions">
              <button
                type="button"
                class="post-editor__spoiler-btn"
                :class="{
                  'post-editor__spoiler-btn--active': section.isSpoiler,
                }"
                :title="
                  section.isSpoiler
                    ? 'Show this section to everyone'
                    : 'Hide this section behind a spoiler'
                "
                :aria-pressed="Boolean(section.isSpoiler)"
                @click="toggleSpoiler(section)"
              >
                <IconEyeOff
                  v-if="section.isSpoiler"
                  :data-testid="`toggle-spoiler-${section.hash}`"
                />
                <IconEye
                  v-else
                  :data-testid="`toggle-spoiler-${section.hash}`"
                />
              </button>

              <button
                type="button"
                class="post-editor__delete-btn"
                @click="requestDeleteSection(section)"
              >
                <CloseIcon
                  title="Delete"
                  :data-testid="`delete-section-${section.hash}`"
                />
              </button>
            </div>
          </div>
        </template>
      </Draggable>

      <PostEditorAddSectionButtons
        v-if="sections.length < consts.POST_MAX_SECTIONS"
        class="post-editor__add-section-buttons"
        @add-section="createSection"
      />
    </div>

    <div v-if="isPreview" class="post-editor__preview">
      <Post
        v-if="sections.length"
        v-model:post="previewPost"
        data-testid="post-preview"
        :collapsible="false"
        :interactive="false"
      />

      <p
        v-else
        class="post-editor__preview-empty"
        data-testid="post-preview-empty"
      >
        Nothing to preview yet. Add a section and it shows up here the way
        readers will see it.
      </p>
    </div>

    <ConfirmModal
      data-testid="confirm-delete-modal"
      :is-open="Boolean(sectionPendingDeletion)"
      :title="'Delete section?'"
      :message="'This section has content and will be permanently removed. Are you sure?'"
      confirm-label="Delete"
      cancel-label="Cancel"
      @confirm="confirmDeleteSection"
      @cancel="cancelDeleteSection"
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
import Post from '../Post/Post.vue';
import {
  hasSectionContent,
  isPictureSection,
  isTextSection,
  isVideoSection,
} from '../Post/is-section-of-type';
import PostEditorAddSectionButtons from './PostEditorAddSectionButtons.vue';
import PostEditorPicture from './PostEditorPicture.vue';
import PostEditorTags from './PostEditorTags.vue';
import PostEditorVideo from './PostEditorVideo.vue';
import { buildPreviewPost } from './build-preview-post';
import { api } from '@/api';
import { postTypes } from '@/api/posts';
import * as consts from '@/const';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseSegmentedControl from '@common/BaseSegmentedControl.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';
import ConfirmModal from '@common/ConfirmModal.vue';
import { TextEditorFeatures } from '@common/text-editor-features';
import CloseIcon from '@icons/IconExit.vue';
import IconEye from '@icons/IconEye.vue';
import IconEyeOff from '@icons/IconEyeOff.vue';

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

const sectionPendingDeletion = ref<postTypes.PostSection | null>(null);

const isPreview = ref(false);

const modeOptions = [
  { value: 'write', label: 'Write', dataTestid: 'write-mode-button' },
  { value: 'preview', label: 'Preview', dataTestid: 'preview-mode-button' },
];

// A snapshot rather than a computed, since Post takes its post as a model
const previewPost = ref<postTypes.Post>(
  buildPreviewPost({ title: '', tags: [], sections: [], author: null }),
);

const openPreview = () => {
  const user = userStore.user;

  previewPost.value = buildPreviewPost({
    title: title.value,
    tags: tags.value,
    sections: sections.value,
    author: user
      ? { _id: user._id, login: user.login, avatar: user.avatar }
      : null,
  });

  isPreview.value = true;
};

const mode = computed({
  get: () => (isPreview.value ? 'preview' : 'write'),
  set: (value) => {
    if (value === 'preview') {
      openPreview();

      return;
    }

    isPreview.value = false;
  },
});

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
    // Client-side only, backend will override this
    hash: crypto.randomUUID(),
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
  const currentSectionIndex = sections.value.findIndex(
    (section) => isPictureSection(section) && section.url === data.url,
  );

  if (currentSectionIndex === -1) {
    return;
  }

  sections.value[currentSectionIndex] = {
    ...data,
    isSpoiler: sections.value[currentSectionIndex].isSpoiler,
  };
};

const toggleSpoiler = (section: postTypes.PostSection) => {
  section.isSpoiler = !section.isSpoiler;
};

const requestDeleteSection = (section: postTypes.PostSection) => {
  if (hasSectionContent(section)) {
    sectionPendingDeletion.value = section;

    return;
  }

  deleteSection(section);
};

const confirmDeleteSection = () => {
  if (sectionPendingDeletion.value) {
    deleteSection(sectionPendingDeletion.value);
  }

  sectionPendingDeletion.value = null;
};

const cancelDeleteSection = () => {
  sectionPendingDeletion.value = null;
};

const deleteSection = (section: postTypes.PostSection) => {
  // When it's edit mode backend logic will handle the deletion of an uploaded picture
  if (
    section.type === postTypes.POST_SECTION_TYPES.PICTURE &&
    section.isFile &&
    !props.isEdit
  ) {
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

    const data = await api.users.getMyTemplate();

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

  await api.posts.updatePostById(props.post._id, {
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

    const data = await api.users.updateMyTemplate({
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

<style>
.post-editor {
  &__mode {
    margin-right: auto;
    margin-bottom: 20px;
    margin-left: auto;
  }

  /* Matches the gap write mode gets from the add-section buttons. */
  &__preview {
    margin-bottom: 32px;
  }

  &__preview-empty {
    margin: 0;
    padding: 3rem 1rem;
    color: var(--color-text-secondary);
    text-align: center;
  }

  &__title {
    margin-bottom: 12px;
    font-size: 20px;
  }

  &__tags {
    margin-bottom: 16px;
  }

  &__section {
    align-items: center;
    position: relative;
    margin-bottom: 32px;
    cursor: move;

    .base-text-editor {
      border: 1px solid var(--color-text-secondary);
      border-radius: 8px;

      @media (--phone-only) {
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

        @media (--phone-only) {
          border-right: none;
          border-left: none;
        }
      }
    }

    &--spoiler {
      outline: 1px dashed var(--color-warning);
      outline-offset: 4px;

      @media (--phone-only) {
        outline-offset: 0;
      }

      /* Shows the author what a reader sees, and lifts as soon as the section
         is reached so it never stands in the way of editing. */
      &::after {
        position: absolute;
        opacity: 1;
        z-index: 1;
        border-radius: 8px;
        inset: 0;
        content: '';
        pointer-events: none;
        transition: opacity 250ms ease-out;
        backdrop-filter: blur(8px);
      }

      &:hover::after,
      &:focus-within::after {
        opacity: 0;
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

  &__spoiler-badge {
    display: flex;
    align-items: center;
    position: absolute;
    top: -10px;
    left: 16px;
    z-index: 2;
    gap: 4px;
    padding: 2px 8px;
    border: 1px dashed var(--color-warning);
    border-radius: 999px;
    background: var(--color-surface-secondary);
    color: var(--color-warning);
    font-size: 0.75rem;
    font-weight: bold;

    svg {
      width: 14px;
      height: 14px;
      fill: var(--color-warning);
    }
  }

  &__section-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    top: 0;
    right: -20px;
    z-index: 2;
    gap: 12px;

    @media (--phone-only) {
      flex-direction: row;
      top: -14px;
      right: 12px;
    }
  }

  &__spoiler-btn,
  &__delete-btn {
    display: flex;
    padding: 0;
    border: none;
    background-color: transparent;

    &:hover {
      filter: brightness(120%);
    }

    svg {
      width: 18px;
      height: 18px;
      cursor: pointer;
      transition: fill 0.3s ease-in-out;
    }
  }

  &__delete-btn svg {
    fill: var(--color-danger);
  }

  &__spoiler-btn svg {
    fill: var(--color-text-secondary);
  }

  &__spoiler-btn--active svg,
  &__spoiler-btn:hover svg {
    fill: var(--color-warning);
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
