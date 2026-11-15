import { describe, expect, it } from 'vitest';
import { filterFromQuery, filterToQuery } from './query';

describe('filterFromQuery', () => {
  it('Reads every filter from the address', () => {
    expect(
      filterFromQuery({
        title: 'moon',
        tags: ['space', 'night'],
        dateFrom: '2026-01-01',
        dateTo: '2026-02-01',
        ratingFrom: '-5',
        ratingTo: '0',
      }),
    ).toEqual({
      title: 'moon',
      tags: ['space', 'night'],
      dateFrom: '2026-01-01',
      dateTo: '2026-02-01',
      ratingFrom: -5,
      ratingTo: 0,
    });
  });

  it('Reads a single tag as one tag', () => {
    expect(filterFromQuery({ tags: 'space' }).tags).toEqual(['space']);
  });

  it('Leaves out what the address does not set, or sets to nonsense', () => {
    expect(filterFromQuery({ ratingFrom: 'high', other: 'x' })).toEqual({
      title: '',
      tags: [],
      dateFrom: '',
      dateTo: '',
      ratingFrom: null,
      ratingTo: null,
    });
  });
});

describe('filterToQuery', () => {
  it('Keeps only the filters that are set, a rating of 0 included', () => {
    expect(
      filterToQuery({
        title: 'moon',
        tags: [],
        dateFrom: '',
        dateTo: '',
        ratingFrom: 0,
        ratingTo: null,
      }),
    ).toEqual({ title: 'moon', ratingFrom: 0 });
  });
});
