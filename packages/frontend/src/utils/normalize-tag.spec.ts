import { describe, it, expect } from 'vitest';
import { normalizeTag } from './normalize-tag';

describe('normalizeTag', () => {
  it.each([
    ['cats', 'cats'],
    ['Cats', 'cats'],
    ['  cats  ', 'cats'],
    ['#hash', 'hash'],
    ['two   words', 'two words'],
    ['C++, again!', 'c again'],
    ['#!?', ''],
  ])('spells %j as %j', (typed, stored) => {
    expect(normalizeTag(typed)).toBe(stored);
  });
});
