import type { SearchFilter } from './types';

/** A rating of 0 is a filter too, so falsy is not enough */
export const isFilterSet = (value: SearchFilter[keyof SearchFilter]) =>
  Array.isArray(value) ? value.length > 0 : value !== null && value !== '';
