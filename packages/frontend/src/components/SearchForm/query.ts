import { omitBy } from 'lodash-es';
import type { LocationQuery, LocationQueryValue } from 'vue-router';
import { isFilterSet } from './is-filter-set';
import type { SearchFilter } from './types';

type QueryValue = LocationQueryValue | LocationQueryValue[] | undefined;

const toText = (value: QueryValue) =>
  (Array.isArray(value) ? value[0] : value) ?? '';

const toRating = (value: QueryValue) => {
  const text = toText(value);
  const rating = Number(text);

  return text === '' || Number.isNaN(rating) ? null : rating;
};

/** The search page's address is the filter: Back and Forward, a reload and a
 * shared link all show what it says */
export const filterFromQuery = (query: LocationQuery): SearchFilter => ({
  title: toText(query.title),
  // A single ?tags=x is parsed as a string, several as an array
  tags: [query.tags ?? []].flat().filter((tag): tag is string => Boolean(tag)),
  dateFrom: toText(query.dateFrom),
  dateTo: toText(query.dateTo),
  ratingFrom: toRating(query.ratingFrom),
  ratingTo: toRating(query.ratingTo),
});

export const filterToQuery = (filter: SearchFilter) =>
  omitBy(filter, (value) => !isFilterSet(value));
