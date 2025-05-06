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
          <template v-if="section.type === POST_SECTION_TYPES.TEXT">
            <BaseTextEditor
              :id="section.hash"
              v-model="section.content"
              data-testid="text-section"
            />
          </template>

          <template v-else-if="section.type === POST_SECTION_TYPES.PICTURE">
            <PostEditorPicture
              v-model="section.url"
              data-testid="pic-section"
              @set-section="setSection"
            />
          </template>

          <template v-else-if="section.type === POST_SECTION_TYPES.VIDEO">
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
      v-if="sections.length < POST_MAX_SECTIONS"
      class="post-editor__add-section-buttons"
      @add-section-by-type="createSection"
    />

    <div class="post-editor__submit-form">
      <template v-if="isEdit">
        <BaseButton
          class="post-editor__submit-form-btn"
          data-testid="finish-edit-post-button"
          :loading="saving"
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
          :loading="sending"
          :disabled="isSubmitDisabled"
          @click="createPost"
        >
          Create Post
        </BaseButton>
        <BaseButton
          stretched
          class="post-editor__submit-form-btn"
          data-testid="save-draft-button"
          :loading="saving"
          :disabled="!isDirty"
          @click="saveDraft"
        >
          Save Draft
        </BaseButton>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from 'pinia';
import { defineComponent, nextTick } from 'vue';
import Draggable from 'vuedraggable';
import PostEditorAddSectionButtons from './PostEditorAddSectionButtons.vue';
import PostEditorPicture from './PostEditorPicture.vue';
import PostEditorTags from './PostEditorTags.vue';
import PostEditorVideo from './PostEditorVideo.vue';
import api from '@/api';
import consts from '@/const/const';
import { useNotificationsStore } from '@/store/notifications';
import { useUserStore } from '@/store/user';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';
import CloseIcon from '@icons/IconExit.vue';

export default defineComponent({
  components: {
    BaseButton,
    BaseInput,
    BaseTextEditor,
    PostEditorAddSectionButtons,
    PostEditorPicture,
    PostEditorVideo,
    PostEditorTags,
    CloseIcon,
    Draggable,
  },
  props: ['isEdit', 'post'],
  data() {
    return {
      isDirty: false,
      title: '',
      sending: false,
      saving: false,
      sections: [],
      tags: [],
      POST_SECTION_TYPES: consts.POST_SECTION_TYPES,
      POST_MAX_SECTIONS: consts.POST_MAX_SECTIONS,
    };
  },
  computed: {
    ...mapState(useUserStore, {
      userId: (state) => state.user?.id,
    }),
    isSubmitDisabled() {
      return Boolean(this.validation.title || this.validation.sections);
    },
    validation() {
      const validation = {
        title: '',
        sections: '',
      };

      // title
      if (this.title.length === 0) {
        validation.title = "Title can't be empty";
      } else if (this.title.length > consts.POST_TITLE_MAX_LENGTH) {
        validation.title = `Title can't be longer than ${consts.POST_TITLE_MAX_LENGTH} symbols`;
      }

      // sections
      if (!this.sections.length) {
        validation.sections = 'You should add at least one section';
      }

      return validation;
    },
  },
  watch: {
    title() {
      this.isDirty = true;
    },
    tags: {
      handler() {
        this.isDirty = true;
      },
      deep: true,
    },
    sections: {
      handler() {
        this.isDirty = true;
      },
      deep: true,
    },
  },
  async created() {
    if (this.isEdit) {
      this.sections = this.post.sections;
      this.title = this.post.title;
      this.tags = this.post.tags;
    } else {
      if (!this.userId) {
        return;
      }

      const res = await api.users.getUserTemplate(this.userId);

      if (!res.data.error) {
        this.title = res.data.title;
        this.sections = res.data.sections || [];
        this.tags = res.data.tags || [];
      }
    }

    nextTick(() => {
      this.isDirty = false;
    });
  },
  methods: {
    ...mapActions(useNotificationsStore, ['showInfoNotification']),
    async createPost() {
      this.sending = true;
      const res = await api.posts.createPost({
        sections: this.sections,
        title: this.title,
        tags: this.tags,
      });

      if (!res.data.error) {
        this.$router.push({
          name: 'Single',
          params: {
            slug: res.data.slug,
          },
        });
      }

      this.sending = false;
    },
    async saveEdited() {
      const res = await api.posts.updatePostById(this.post.id, {
        title: this.title,
        sections: this.sections,
        tags: this.tags,
      });

      if (!res.data.error) {
        this.showInfoNotification({
          message: 'Post has been saved successfully',
        });

        this.$router.push({
          name: 'Single',
          params: {
            slug: this.post.slug,
          },
        });
      }
    },
    async saveDraft() {
      this.saving = true;

      const res = await api.users.updateUserTemplate(this.userId, {
        title: this.title,
        sections: this.sections,
        tags: this.tags,
      });

      this.saving = false;

      if (!res.data.error) {
        this.title = res.data.title;
        this.sections = res.data.sections;
        this.tags = res.data.tags;

        this.showInfoNotification({
          message: 'Draft post has been saved successfully!',
        });

        nextTick(() => {
          this.isDirty = false;
        });
      }
    },
    async deleteSection(section) {
      if (section.type === this.POST_SECTION_TYPES.PICTURE && section.isFile) {
        const res = await api.users.removeFilePicSection(section.hash);

        if (!res.data.error) {
          this.sections.splice(this.sections.indexOf(section), 1);
        }
      } else {
        this.sections.splice(this.sections.indexOf(section), 1);
      }
    },
    setSection(data) {
      const section = this.sections.find((el) => el.url === data.url);

      this.sections[this.sections.indexOf(section)] = data;
    },
    createSection(type) {
      this.sections.push({
        type,
        hash: (Math.random() * Math.random()).toString(36),
      });
    },
  },
});
</script>

<style lang="scss">
@import '@/styles/mixins';

.post-editor {
  &__title {
    margin-bottom: 12px;
    font-size: 20px;
  }

  &__tags {
    margin-bottom: 16px;
  }

  &__section {
    @include flex-row;

    align-items: center;
    position: relative;
    margin-bottom: 32px;
    cursor: move;

    .base-text-editor {
      border: 1px solid var(--color-gray-light);
      border-radius: 8px;

      @include for-size(phone-only) {
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

    @include for-size(phone-only) {
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
