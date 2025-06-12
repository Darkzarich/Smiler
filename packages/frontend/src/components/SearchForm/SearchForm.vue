<template>
  <div class="search-form">
    <h1 class="search-form__title">Search</h1>

    <div class="search-form__title-field">
      <BaseInput
        v-model="filters.title"
        placeholder="Title"
        data-testid="search-form-input"
        @keyup.enter="search"
      />
    </div>

    <div class="search-form__columns">
      <div class="search-form__column">
        <BaseDatePicker
          v-model="filters.dateFrom"
          class="search-form__date-picker-from"
          data-testid="search-form-date-from"
          :label="'Date from'"
        />
        <BaseDatePicker
          v-model="filters.dateTo"
          data-testid="search-form-date-to"
          :label="'Date to'"
        />
      </div>

      <div class="search-form__column">
        <BaseSlider
          v-model="filters.ratingFrom"
          data-testid="search-form-rating-from"
          class="search-form__slider-from"
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
      <PostEditorTags
        v-model:tags="filters.tags"
        data-testid="search-form-tags"
      />
    </div>

    <div class="search-form__actions">
      <BaseButton data-testid="search-form-submit" stretched @click="search">
        Submit
      </BaseButton>

      <BaseButton
        data-testid="search-form-clear"
        stretched
        @click="clearFilters"
      >
        Clear filters
      </BaseButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { cloneDeep, omitBy } from 'lodash-es';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { SearchFilter } from './types';
import BaseButton from '@common/BaseButton.vue';
import BaseDatePicker from '@common/BaseDatePicker.vue';
import BaseInput from '@common/BaseInput.vue';
import BaseSlider from '@common/BaseSlider.vue';
import PostEditorTags from '@components/PostEditor/PostEditorTags.vue';

const defaultFilters: SearchFilter = {
  title: '',
  tags: [],
  dateFrom: '',
  dateTo: '',
  ratingFrom: null,
  ratingTo: null,
};

const router = useRouter();

const modelValue = defineModel<SearchFilter>();

const filters = ref<SearchFilter>(cloneDeep(defaultFilters));

watch(
  modelValue,
  (newVal) => {
    if (newVal) {
      filters.value = cloneDeep(newVal);
    }
  },
  { immediate: true },
);

const search = () => {
  modelValue.value = filters.value;

  applyFiltersToRoute();
};

const clearFilters = () => {
  filters.value = cloneDeep(defaultFilters);

  modelValue.value = filters.value;

  applyFiltersToRoute();
};

const applyFiltersToRoute = () => {
  router.push({
    query: omitBy(filters.value, (value) => !value),
  });
};
</script>

<style lang="scss">
@use '@/styles/mixins';

.search-form {
  &__title {
    margin-bottom: 12px;
    color: var(--color-main-text);
    text-align: center;
    font-size: 1.5rem;
    font-weight: 500;
  }

  &__title-field {
    margin-bottom: 12px;
  }

  &__columns {
    @include mixins.flex-row;

    justify-content: space-around;
    margin-bottom: 12px;
  }

  &__column {
    @include mixins.flex-col;

    justify-content: center;
  }

  &__date-picker-from,
  &__slider-from {
    margin-bottom: 12px;
  }

  &__actions {
    @include mixins.flex-row;

    gap: 16px;
    margin-top: 24px;
  }
}
</style>
