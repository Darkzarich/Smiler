<template>
<div>
  <div class="search-form__string">
    <input-element
      v-model="filters.title"
    />
  </div>
  <div class="search-form__extra">
    <div class="search-form__extra-date">
      <date-pick-element
        v-model="filters.dateFrom"
        :label="'Date from'"
      />
      <date-pick-element
        v-model="filters.dateTo"
        :label="'Date to'"
      />
    </div>
    <div class="search-form__extra-slider">
      <slider-element
        v-model="filters.ratingFrom"
        :label="'Rating from'"
      />
      <slider-element
        v-model="filters.ratingTo"
        :label="'Rating to'"
      />
    </div>
  </div>
  <div class="search-form__submit">
    <button-element
      :callback="search"
    >
      Submit
    </button-element>
    <button-element
      :callback="clear"
    >
      Clear filters
    </button-element>
  </div>
</div>
</template>

<script>
import inputElement from '@/components/BasicElements/InputElement';
import datePickElement from '@/components/BasicElements/DatePickElement';
import buttonElement from '@/components/BasicElements/ButtonElement';
import sliderElement from '@/components/BasicElements/SliderElement';

export default {
  components: {
    inputElement,
    buttonElement,
    datePickElement,
    sliderElement,
  },
  props: ['value'],
  data() {
    return {
      filters: {
        title: this.value.title,
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
        this.filters[el] = undefined;
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
