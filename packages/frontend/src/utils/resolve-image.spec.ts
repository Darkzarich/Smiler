import { describe, it, expect, vi } from 'vitest';
import { resolveImage } from './resolve-image';

vi.mock('@/config/config', () => ({
  default: { VUE_APP_API_URL: 'http://localhost:3000' },
}));

describe('resolveImage', () => {
  it('returns an absolute URL untouched', () => {
    expect(resolveImage('https://cdn.example.com/picture.jpg')).toBe(
      'https://cdn.example.com/picture.jpg',
    );
    expect(resolveImage('http://cdn.example.com/picture.jpg')).toBe(
      'http://cdn.example.com/picture.jpg',
    );
  });

  it('returns an absolute URL untouched regardless of the top level domain', () => {
    expect(resolveImage('https://gallery.photography/picture.jpg')).toBe(
      'https://gallery.photography/picture.jpg',
    );
    expect(resolveImage('https://8.8.8.8/picture.jpg')).toBe(
      'https://8.8.8.8/picture.jpg',
    );
  });

  it('prepends the API origin to an uploads path', () => {
    expect(resolveImage('/uploads/user-id/picture.jpg')).toBe(
      'http://localhost:3000/uploads/user-id/picture.jpg',
    );
  });
});
