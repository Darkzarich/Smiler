<template>
  <div class="post-editor__tags">
    <div class="post-editor__tags-container" data-testid="post-tags-list">
      <div
        v-for="tag in tags"
        :key="tag"
        class="post-editor__tags-item"
      >
        {{ tag }}
        <span :data-testid="`remove-tag-button-${tag}`" class="post-editor__tags-item-remove" @click="removeTag(tag)">
          x
        </span>
      </div>
    </div>
    <div v-if="tags.length < POST_MAX_TAGS" class="post-editor__tags-input">
      <InputElement
        v-model="tagInput"
        data-testid="post-tag-input"
        placeholder="Input up to 8 tags"
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
// TODO: This can be a BasicElements
import InputElement from '../BasicElements/InputElement.vue';
import consts from '@/const/const';

export default {
  components: {
    InputElement,
  },
  model: {
    prop: 'tags',
  },
  props: {
    tags: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      tagInput: '',
      POST_MAX_TAGS: consts.POST_MAX_TAGS,
    };
  },
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
          this.$emit('input', this.tags.concat(this.tagInput));
          this.tagInput = '';
        }
      }
    },
    removeTag(tag) {
      this.$emit('input', this.tags.filter((el) => el !== tag));
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
