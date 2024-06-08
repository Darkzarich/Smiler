<template>
  <div class="post-editor-tags">
    <div
      v-if="tags.length"
      class="post-editor-tags__list"
      data-testid="post-tags-list"
    >
      <div v-for="tag in tags" :key="tag" class="post-editor-tags__item">
        {{ tag }}
        <button
          type="button"
          :data-testid="`remove-tag-button-${tag}`"
          class="post-editor-tags__ghost-btn post-editor-tags__remove-tag-btn"
          @click="removeTag(tag)"
        >
          x
        </button>
      </div>
    </div>

    <div v-if="tags.length < POST_MAX_TAGS" class="post-editor-tags__form">
      <BaseInput
        v-model="tagInput"
        data-testid="post-tag-input"
        placeholder="Input up to 8 tags"
        :error="validation"
        @keyup:enter="addTag"
      />

      <!-- TODO: Think of a component for this -->
      <button
        v-if="tagInput.length > 0"
        type="button"
        class="post-editor-tags__ghost-btn post-editor-tags__add-tag-btn"
        @click="addTag"
      >
        +
      </button>
    </div>
  </div>
</template>

<script>
// TODO: This can be a BasicElements
import consts from '@/const/const';
import BaseInput from '@common/BaseInput.vue';

export default {
  components: {
    BaseInput,
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
      this.$emit(
        'input',
        this.tags.filter((el) => el !== tag),
      );
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/mixins';
@import '@/styles/colors';

.post-editor-tags {
  @include flex-row;

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
    padding: 2px 4px;
    border: 1px solid $firm;
    border-radius: 5px;
    background: transparent;
    color: $firm;
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: bold;
    user-select: none;
  }

  &__form {
    display: flex;
    align-items: center;
  }

  &__ghost-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    background-color: transparent;
    font-size: 1.5rem;
    user-select: none;
    cursor: pointer;
  }

  &__add-tag-btn {
    color: $firm;
  }

  &__remove-tag-btn {
    color: $error;
    font-size: 0.8rem;
  }
}
</style>
