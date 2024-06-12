<template>
  <div class="post-editor">
    <BaseInput
      v-model="title"
      class="post-editor__title"
      data-testid="post-title-input"
      :placeholder="'Title'"
      :error="validation.title"
    />

    <PostEditorTags v-model="tags" />

    <Draggable
      :list="sections"
      :animation="200"
      ghost-class="post-editor__section_moving"
      chosen-class="post-editor__section_chosen"
    >
      <TransitionGroup name="post-editor__section" data-testid="post-sections">
        <div
          v-for="section in sections"
          :key="section.hash"
          class="post-editor__section"
          data-testid="post-section"
        >
          <!-- TODO: Refactor this part -->
          <template v-if="section.type === POST_SECTION_TYPES.TEXT">
            <BaseTextEditor
              :id="section.hash"
              v-model="section.content"
              data-testid="text-section"
            />
            <div class="post-editor__delete" @click="deleteSection(section)">
              <CloseIcon
                title="Delete"
                :data-testid="`delete-section-${section.hash}`"
              />
            </div>
          </template>
          <template v-if="section.type === POST_SECTION_TYPES.PICTURE">
            <PostEditorPicture
              v-model="section.url"
              data-testid="pic-section"
              @set-section="setSection"
            />
            <div class="post-editor__delete" @click="deleteSection(section)">
              <CloseIcon
                title="Delete"
                :data-testid="`delete-section-${section.hash}`"
              />
            </div>
          </template>
          <template v-if="section.type === POST_SECTION_TYPES.VIDEO">
            <PostEditorVideo
              v-model="section.url"
              data-testid="video-section"
            />
            <div class="post-editor__delete" @click="deleteSection(section)">
              <CloseIcon
                title="Delete"
                :data-testid="`delete-section-${section.hash}`"
              />
            </div>
          </template>
        </div>
      </TransitionGroup>
    </Draggable>
    <div
      v-if="sections.length < POST_MAX_SECTIONS"
      class="post-editor__control"
    >
      <div
        class="post-editor__control-item"
        data-testid="add-text-button"
        role="button"
        tabindex="0"
        @click="createSection(POST_SECTION_TYPES.TEXT)"
      >
        <IconText />
      </div>
      <div
        class="post-editor__control-item"
        data-testid="add-pic-button"
        role="button"
        tabindex="0"
        @click="createSection(POST_SECTION_TYPES.PICTURE)"
      >
        <IconPicture />
      </div>
      <div
        class="post-editor__control-item"
        data-testid="add-video-button"
        role="button"
        tabindex="0"
        @click="createSection(POST_SECTION_TYPES.VIDEO)"
      >
        <IconVideo />
      </div>
    </div>

    <div v-else class="post-editor__control-error">
      Can't add any more sections. Max amount of sections is
      {{ POST_MAX_SECTIONS }}.
    </div>

    <div class="post-editor__submit">
      <template v-if="edit">
        <BaseButton
          class="post-editor__submit-btn"
          data-testid="finish-edit-post-button"
          :loading="saving"
          :disabled="!sections.length"
          :callback="saveEdited"
        >
          Save Edited
        </BaseButton>
      </template>
      <template v-else>
        <BaseButton
          class="post-editor__submit-btn"
          stretched
          data-testid="create-post-button"
          :loading="sending"
          :callback="createPost"
          :disabled="isSubmitDisabled"
        >
          Create Post
        </BaseButton>
        <BaseButton
          stretched
          class="post-editor__submit-btn"
          data-testid="save-draft-button"
          :loading="saving"
          :disabled="!sections.length"
          :callback="saveDraft"
        >
          Save Draft
        </BaseButton>
      </template>
    </div>
  </div>
</template>

<script>
import Draggable from 'vuedraggable';
import { mapState } from 'vuex';
import PostEditorPicture from './PostEditorPicture.vue';
import PostEditorTags from './PostEditorTags.vue';
import PostEditorVideo from './PostEditorVideo.vue';
import api from '@/api';
import consts from '@/const/const';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseTextEditor from '@common/BaseTextEditor.vue';
import CloseIcon from '@icons/IconExit.vue';
import IconPicture from '@icons/IconPicture.vue';
import IconText from '@icons/IconText.vue';
import IconVideo from '@icons/IconVideo.vue';

export default {
  components: {
    BaseButton,
    BaseInput,
    BaseTextEditor,
    PostEditorPicture,
    PostEditorVideo,
    PostEditorTags,
    CloseIcon,
    IconPicture,
    IconText,
    IconVideo,
    Draggable,
  },
  props: ['edit', 'post'],
  data() {
    return {
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
    ...mapState({
      getUserLogin: (state) => state.user.login,
    }),
    isSubmitDisabled() {
      return !!(this.validation.title || this.validation.sections);
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

      return validation;
    },
  },
  async created() {
    if (this.edit) {
      this.sections = this.post.sections;
      this.title = this.post.title;
      this.tags = this.post.tags;
    } else {
      const res = await api.users.getUserTemplate(this.getUserLogin);
      if (!res.data.error) {
        this.title = res.data.title;
        this.sections = res.data.sections || [];
        this.tags = res.data.tags || [];
      }
    }
  },
  methods: {
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
        this.$store.dispatch('showInfoNotification', {
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
    // TODO: Fix cannot save empty draft
    async saveDraft() {
      this.saving = true;

      const data = await api.users.updateUserTemplate(this.getUserLogin, {
        title: this.title,
        sections: this.sections,
        tags: this.tags,
      });

      if (!data.data.error) {
        this.$store.dispatch('showInfoNotification', {
          message: 'Draft post has been saved successfully!',
        });
      }

      this.saving = false;
    },
    async deleteSection(section) {
      if (section.type === this.POST_SECTION_TYPES.PICTURE && section.isFile) {
        const res = await api.users.removeFilePicSection(
          this.getUserLogin,
          section.hash,
        );
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
};
</script>

<style lang="scss">
@use 'sass:color';
@import '@/styles/mixins';

.post-editor {
  &__submit {
    display: flex;
    justify-content: space-around;
    gap: 16px;

    .button {
      width: 25%;
      white-space: nowrap;
    }
  }

  &__title {
    margin-bottom: 12px;
  }

  &__title input {
    font-size: 20px;
  }

  &__section {
    @include flex-row;

    align-items: center;
    position: relative;
    margin-top: 1rem;
    cursor: move;

    &_moving {
      opacity: 0.4;
    }

    &_chosen {
      .text-editor-container,
      .post-image-upload,
      .post-video-upload {
        border: 1px solid $firm;
      }
    }

    &-enter-active,
    &-leave-active {
      transition: all 0.3s;
    }

    &-enter,
    &-leave-to {
      opacity: 0;
      transform: translateY(15px);
    }
  }

  &__control {
    display: flex;
    justify-content: center;
    margin: 1rem;
    padding: 1rem;

    &-item {
      margin-left: 1rem;
      padding: 1rem;
      border: 1px solid $light-gray;
      background: $bg;
      cursor: pointer;

      &:hover {
        background: $widget-bg;
      }

      svg {
        fill: $light-gray;
      }
    }
  }

  &__delete {
    position: absolute;
    right: -20px;

    @include for-size(phone-only) {
      width: 10px;
    }

    svg {
      cursor: pointer;
      transition: fill 0.3s ease-in-out;
      fill: $error;

      &:hover {
        fill: color.adjust($error, $lightness: -20%);
      }
    }
  }
}
</style>
