<template>
  <div class="post-editor__tags">
    <div class="post-editor__tags-container" data-testid="post-tags-list">
      <div
        v-for="tag in tags"
        :key="tag"
        class="post-editor__tags-item"
      >
        {{ tag }}
        <span @click="removeTag(tag)" class="post-editor__tags-item-remove">
          x
        </span>
      </div>
    </div>
    <div v-if="tags.length < POST_MAX_TAGS" class="post-editor__tags-input">
      <input-element
        data-testid="post-tag-input"
        placeholder="Input up to 8 tags"
        v-model="tagInput"
        :enter-callback="addTag"
        :error="validation"
      />
      <span v-if="tagInput.length > 0" @click="addTag">
        +
      </span>
    </div>
  </div>
</template>

<script>
import consts from '@/const/const';
import InputElement from '../BasicElements/InputElement.vue';

export default {
  components: {
    InputElement,
  },
  data() {
    return {
      tagInput: '',
      POST_MAX_TAGS: consts.POST_MAX_TAGS,
    };
  },
  props: ['tags'],
  computed: {
    validation() {
      let validation = '';

      if (this.tagInput.length > consts.POST_MAX_TAG_LEN) {
        validation = `Tag can't be longer than ${consts.POST_MAX_TAG_LEN}`;
      }

      return validation;
    },
  },
  methods: {
    addTag() {
      if (this.tagInput.length > 0) {
        const checkDouble = this.tags.find((el) => el === this.tagInput);
        if (!checkDouble && !this.validation) {
          this.tags.push(this.tagInput);
          this.tagInput = '';
        }
      }
    },
    removeTag(tag) {
      this.tags.splice(this.tags.indexOf(tag), 1);
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins.scss';
@import '@/styles/colors.scss';

  .post-editor__tags {
    @include flex-row;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
    &-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }
    &-item {
      margin-top: 0.5rem;
      color: $firm;
      font-weight: bold;
      background: transparent;
      font-size: 0.8rem;
      font-family: monospace;
      user-select: none;
      cursor: pointer;
      padding: 0.1rem;
      margin-right: 0.5rem;
      border-radius: 5px;
      border: 1px solid $firm;
      &-remove {
        color: $error;
      }
    }
    &-input {
      display: flex;
      align-items: center;
      span {
        color: $firm;
        font-weight: bold;
        font-size: 1.5rem;
        cursor: pointer;
        user-select: none;
      }
    }
  }

</style>
