<template>
  <div class="search-form">
    <h1 class="u-page-title">Search</h1>

    <div class="search-form__title-field">
      <BaseInput
        v-model="filters.title"
        placeholder="Title"
        data-testid="search-form-input"
        @keyup.enter="search"
      />
    </div>

    <div class="search-form__ranges">
      <BaseInput
        v-model="filters.dateFrom"
        type="date"
        label="Date from"
        data-testid="search-form-date-from"
      />
      <BaseInput
        v-model="filters.dateTo"
        type="date"
        label="Date to"
        data-testid="search-form-date-to"
      />
      <BaseInput
        v-model="ratingFrom"
        type="number"
        label="Rating from"
        placeholder="Any"
        data-testid="search-form-rating-from"
        @keyup.enter="search"
      />
      <BaseInput
        v-model="ratingTo"
        type="number"
        label="Rating to"
        placeholder="Any"
        data-testid="search-form-rating-to"
        @keyup.enter="search"
      />
    </div>

    <div class="search-form__tags">
      <PostEditorTags
        v-model:tags="filters.tags"
        data-testid="search-form-tags"
      />
    </div>

    <div class="search-form__actions u-flex-row">
      <BaseButton
        data-testid="search-form-submit"
        type="primary"
        stretched
        @click="search"
      >
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

<script setup lang="ts">
import { cloneDeep } from 'lodash-es';
import { computed, ref, watch } from 'vue';
import { filterFromQuery } from './query';
import type { SearchFilter } from './types';
import BaseButton from '@common/BaseButton.vue';
import BaseInput from '@common/BaseInput.vue';
import PostEditorTags from '@components/PostEditor/PostEditorTags.vue';

const props = defineProps<{
  /** The search the page shows; the fields are a draft of the next one */
  filter: SearchFilter;
}>();

const emit = defineEmits<{
  submit: [filter: SearchFilter];
}>();

const filters = ref<SearchFilter>(cloneDeep(props.filter));

watch(
  () => props.filter,
  (newVal) => {
    filters.value = cloneDeep(newVal);
  },
);

const useRatingField = (key: 'ratingFrom' | 'ratingTo') =>
  computed({
    get: () => filters.value[key]?.toString() ?? '',
    set: (value: string) => {
      filters.value[key] = value === '' ? null : Number(value);
    },
  });

const ratingFrom = useRatingField('ratingFrom');
const ratingTo = useRatingField('ratingTo');

const search = () => {
  emit('submit', cloneDeep(filters.value));
};

const clearFilters = () => {
  filters.value = filterFromQuery({});

  search();
};
</script>

<style>
.search-form {
  &__title-field {
    margin-bottom: 12px;
  }

  /* The column gap matches the actions' so the second column lines up with Clear filters */
  &__ranges {
    display: grid;
    gap: 12px 16px;
    margin-bottom: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &__tags {
    .post-editor-tags__form,
    .base-input {
      flex: 1;
    }

    .post-editor-tags__form {
      min-width: 12rem;
    }
  }

  &__actions {
    gap: 16px;
    margin-top: 24px;
  }
}
</style>
