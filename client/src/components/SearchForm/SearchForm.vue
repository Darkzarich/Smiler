<template>
  <div class="search-form">
    <div class="search-form__string">
      <BaseInput
        v-model="filters.title"
        placeholder="Title"
        data-testid="search-form-input"
        @keyup:enter="search"
      />
    </div>
    <div class="search-form__extra">
      <div class="search-form__extra-date">
        <BaseDatePicker
          v-model="filters.dateFrom"
          data-testid="search-form-date-from"
          :label="'Date from'"
        />
        <BaseDatePicker
          v-model="filters.dateTo"
          data-testid="search-form-date-to"
          :label="'Date to'"
        />
      </div>
      <div class="search-form__extra-slider">
        <BaseSlider
          v-model="filters.ratingFrom"
          data-testid="search-form-rating-from"
          :label="'Rating from'"
        />
        <BaseSlider
          v-model="filters.ratingTo"
          data-testid="search-form-rating-to"
          :label="'Rating to'"
        />
      </div>
    </div>
    <div class="search-form__tags">
      <PostEditorTags v-model="filters.tags" data-testid="search-form-tags" />
    </div>
    <div class="search-form__submit">
      <BaseButton data-testid="search-form-submit" :callback="search">
        Submit
      </BaseButton>
      <BaseButton data-testid="search-form-clear" :callback="clear">
        Clear filters
      </BaseButton>
    </div>
  </div>
</template>

<script>
import BaseButton from '@common/BaseButton.vue';
import BaseDatePicker from '@common/BaseDatePicker.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseSlider from '@common/BaseSlider.vue';
import PostEditorTags from '@components/PostEditor/PostEditorTags.vue';

export default {
  components: {
    BaseInput,
    BaseButton,
    BaseDatePicker,
    BaseSlider,
    PostEditorTags,
  },
  props: ['value'],
  data() {
    return {
      filters: {
        title: this.value.title,
        tags: this.value.tags,
      },
    };
  },
  methods: {
    search() {
      const modFilters = {};
      Object.keys(this.filters).forEach((el) => {
        modFilters[el] = this.filters[el];
      });
      this.$emit('input', modFilters);
      this.$router.push({
        query: modFilters,
      });
    },
    clear() {
      Object.keys(this.filters).forEach((el) => {
        if (typeof this.filters[el] === 'object') {
          this.filters[el] = [];
        } else {
          this.filters[el] = undefined;
        }
      });
      this.$router.push({
        query: this.filters,
      });
    },
  },
};
</script>

<style lang="scss">
@import '@/styles/colors';
@import '@/styles/mixins';

.search-form {
  &__string {
    margin-bottom: 12px;
  }

  &__extra {
    @include flex-row;

    justify-content: space-around;

    &-slider {
      @include flex-col;

      justify-content: center;
    }
  }

  &__submit {
    @include flex-row;

    .button {
      width: 50%;
    }
  }
}
</style>
