<template>
  <div class="post-editor">
    <input-element
      class="post-editor__title"
      data-testid="post-title-input"
      :placeholder="'Title'"
      :error="validation.title"
      v-model="title"
    />
    <post-editor-tags
      :tags="tags"
    />

    <draggable
      :list="sections"
      :animation="200"
      ghost-class="post-editor__section_moving"
      chosen-class="post-editor__section_chosen"
    >
      <transition-group name="post-editor__section" data-testid="post-sections">
        <div
          class="post-editor__section"
          data-testid="post-section"
          :key="section.hash"
          v-for="section in sections">
          <!-- TODO: Refactor this part -->
          <template v-if="section.type === POST_SECTION_TYPES.TEXT">
            <text-editor-element
              data-testid="text-section"
              v-model="section.content"
              :id="section.hash"
            />
            <div class="post-editor__delete" @click="deleteSection(section)">
              <close-icon title="Delete" :data-testid="`delete-section-${section.hash}`" />
            </div>
          </template>
          <template v-if="section.type === POST_SECTION_TYPES.PICTURE">
            <post-editor-picture
              data-testid="pic-section"
              v-model="section.url"
              @set-section="setSection"
            />
            <div class="post-editor__delete" @click="deleteSection(section)">
              <close-icon title="Delete" :data-testid="`delete-section-${section.hash}`" />
            </div>
          </template>
          <template v-if="section.type === POST_SECTION_TYPES.VIDEO">
            <post-editor-video
              data-testid="video-section"
              v-model="section.url"
            />
            <div class="post-editor__delete" @click="deleteSection(section)">
              <close-icon title="Delete" :data-testid="`delete-section-${section.hash}`" />
            </div>
          </template>
        </div>
      </transition-group>
    </draggable>
    <div class="post-editor__control" v-if="sections.length < POST_MAX_SECTIONS">
      <div class="post-editor__control-item" @click="createSection(POST_SECTION_TYPES.TEXT)" data-testid="add-text-button" role="button" tabindex="0">
        <text-icon />
      </div>
      <div class="post-editor__control-item" @click="createSection(POST_SECTION_TYPES.PICTURE)" data-testid="add-pic-button" role="button" tabindex="0">
        <picture-icon />
      </div>
      <div class="post-editor__control-item" @click="createSection(POST_SECTION_TYPES.VIDEO)" data-testid="add-video-button" role="button" tabindex="0">
        <video-icon />
      </div>
    </div>
    <div class="post-editor__control-error" v-else>
      Can't add any more sections. Max amount of sections is {{ POST_MAX_SECTIONS }}.
    </div>
    <div class="post-editor__submit">
      <template v-if="!edit">
        <button-element
          data-testid="create-post-button"
          :loading="sending"
          :callback="createPost"
          :disabled="isSubmitDisabled"
        >
          Create Post
        </button-element>
        <button-element
          data-testid="save-draft-button"
          :loading="saving"
          :disabled="!sections.length"
          :callback="saveDraft"
        >
          Save Draft
        </button-element>
      </template>
      <template v-else>
        <button-element
          :loading="saving"
          :disabled="!sections.length"
          :callback="saveEdited"
        >
          Save Edited
        </button-element>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Draggable from 'vuedraggable';
import api from '@/api';

import closeIcon from '@/library/svg/exit.vue';
import videoIcon from '@/library/svg/video.vue';
import pictureIcon from '@/library/svg/picture.vue';
import textIcon from '@/library/svg/text.vue';
import consts from '@/const/const';
import ButtonElement from '../BasicElements/ButtonElement.vue';
import TextEditorElement from '../BasicElements/TextEditorElement.vue';
import PostEditorPicture from './PostEditorPicture.vue';
import PostEditorVideo from './PostEditorVideo.vue';
import PostEditorTags from './PostEditorTags.vue';
import InputElement from '../BasicElements/InputElement.vue';

export default {
  components: {
    ButtonElement,
    InputElement,
    TextEditorElement,
    PostEditorPicture,
    PostEditorVideo,
    PostEditorTags,
    closeIcon,
    videoIcon,
    pictureIcon,
    textIcon,
    Draggable,
  },
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
  props: ['edit', 'post'],
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
        validation.title = 'Title can\'t be empty';
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

      await api.users.updateUserTemplate(this.getUserLogin, {
        title: this.title,
        sections: this.sections,
        tags: this.tags,
      });

      this.saving = false;
    },
    async deleteSection(section) {
      if (section.type === this.POST_SECTION_TYPES.PICTURE && section.isFile) {
        const res = await api.users.removeFilePicSection(this.getUserLogin, section.hash);
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
@import '@/styles/mixins';

.post-editor {
  &__submit {
    display: flex;
    justify-content: space-around;
    .button {
      white-space: nowrap;
      width: 25%;
    }
  }
  &__title input {
    font-size: 20px;
  }
  &__section {
    @include flex-row();
    align-items: center;
    margin-top: 1rem;
    cursor: move;

    &_moving {
      opacity: 0.4;
    }

    &_chosen {
      .text-editor-container, .post-image-upload, .post-video-upload {
        border: 1px solid $firm;
      }
    }

    .text-editor-container {
      width: 95%;
    }

    &-enter-active, &-leave-active {
        transition: all 0.3s;
    }

    &-enter, &-leave-to {
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
      border: 1px solid $light-gray;
      padding: 1rem;
      background: $bg;
      cursor: pointer;
      &:hover {
        background: $widget-bg;
      }
      margin-left: 1rem;
      svg {
        fill: $light-gray;
      }
    }
  }

  &__delete {
    width: 0;
    @include for-size(phone-only) {
      width: 10px;
    }
    svg {
      cursor: pointer;
      transition: fill 0.3s ease-in-out;
      fill: $error;
      &:hover {
        fill: darken($error, 20%);
      }
    }
  }
}

</style>
