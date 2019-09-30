<template>
  <div class="post-editor">
    <input-element
      class="post-editor__title"
      :place-holder="'Title'"
      v-model="title"
    />
    <transition-group name="post-editor__section">
      <div
        class="post-editor__section"
        :key="section.hash"
        v-for="section in sections">
            <template v-if="section.type === POST_SECTION_TYPES.TEXT">
              <text-editor-element
                v-model="section.content"
              />
              <div class="post-editor__delete" @click="deleteSection(section)">
                <close-icon/>
              </div>
            </template>
            <template v-if="section.type === POST_SECTION_TYPES.PICTURE">
              <post-editor-picture
                v-model="section.url"
              />
              <div class="post-editor__delete" @click="deleteSection(section)">
                <close-icon/>
              </div>
            </template>
      </div>
    </transition-group>
    <div class="post-editor__control" v-if="sections.length < POST_MAX_SECTIONS">
      <div class="post-editor__control-item" @click="createSection(POST_SECTION_TYPES.TEXT)">
        <text-icon/>
      </div>
      <div class="post-editor__control-item" @click="createSection(POST_SECTION_TYPES.PICTURE)">
        <picture-icon/>
      </div>
      <div class="post-editor__control-item" @click="createSection(POST_SECTION_TYPES.VIDEO)">
        <video-icon/>
      </div>
    </div>
    <div class="post-editor__control-error" v-else>
      Can't add any more sections. Max amount of sections is {{ POST_MAX_SECTIONS }}.
    </div>
    <div class="post-editor__submit">
      <button-element
        :loading="sending"
        :callback="createPost"
      >
        Create Post
      </button-element>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import api from '@/api';

import ButtonElement from '../BasicElements/ButtonElement.vue';
import TextEditorElement from '../BasicElements/TextEditorElement.vue';
import PostEditorPicture from './PostEditorPicture';
import InputElement from '../BasicElements/InputElement.vue';

import closeIcon from '@/library/svg/exit';
import videoIcon from '@/library/svg/video';
import pictureIcon from '@/library/svg/picture';
import textIcon from '@/library/svg/text';

import consts from '@/const/const';

export default {
  components: {
    ButtonElement,
    InputElement,
    TextEditorElement,
    PostEditorPicture,
    closeIcon,
    videoIcon,
    pictureIcon,
    textIcon,
  },
  data() {
    return {
      title: '',
      sending: false,
      sections: [],
      POST_SECTION_TYPES: consts.POST_SECTION_TYPES,
      POST_MAX_SECTIONS: consts.POST_MAX_SECTIONS,
    };
  },
  computed: {
    ...mapState({
      getUserLogin: state => state.user.login,
    }),
  },
  async created() {
    const res = await api.users.getUserTemplate(this.getUserLogin);
    if (!res.data.error) {
      this.title = res.data.title;
    }
  },
  methods: {
    async createPost() {
      console.log(this.sections);
      this.sending = true;
      // await api.posts.createPost({
      //   body: this.body,
      //   title: this.title,
      // });
      this.sending = false;
    },
    deleteSection(section) {
      this.sections.splice(this.sections.indexOf(section), 1);
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
    width: 50%;
    margin-left: 25%;
  }
  &__title input {
    font-size: 20px;
  }
  &__section {
    @include flex-row();
    align-items: center;
    margin-top: 1rem;
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
    opacity: 0.5;
    transition: opacity 0.3s ease-in-out;
    &:hover {
      opacity: 1;
    }
    svg {
      cursor: pointer;
      fill: $error;
    }
  }
}

</style>
