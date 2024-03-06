<template>
  <div>
    <div class="search-form__string">
      <InputElement
        v-model="filters.title"
      />
    </div>
    <div class="search-form__extra">
      <div class="search-form__extra-date">
        <DatePickerElement
          v-model="filters.dateFrom"
          :label="'Date from'"
        />
        <DatePickerElement
          v-model="filters.dateTo"
          :label="'Date to'"
        />
      </div>
      <div class="search-form__extra-slider">
        <SliderElement
          v-model="filters.ratingFrom"
          :label="'Rating from'"
        />
        <SliderElement
          v-model="filters.ratingTo"
          :label="'Rating to'"
        />
      </div>
    </div>
    <div class="search-form__tags">
      <PostEditorTags
        :tags="filters.tags"
      />
    </div>
    <div class="search-form__submit">
      <ButtonElement
        :callback="search"
      >
        Submit
      </ButtonElement>
      <ButtonElement
        :callback="clear"
      >
        Clear filters
      </ButtonElement>
    </div>
  </div>
</template>

<script>
import ButtonElement from '@/components/BasicElements/ButtonElement.vue';
import DatePickerElement from '@/components/BasicElements/DatePickerElement.vue';
import InputElement from '@/components/BasicElements/InputElement.vue';
import SliderElement from '@/components/BasicElements/SliderElement.vue';
import PostEditorTags from '@/components/PostEditor/PostEditorTags.vue';

export default {
  components: {
    InputElement,
    ButtonElement,
    DatePickerElement,
    SliderElement,
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
  &__extra {
    @include flex-row();
    justify-content: space-around;
    &-slider {
      @include flex-col();
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
