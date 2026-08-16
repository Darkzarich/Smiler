import { describe, expect, it } from 'vitest';
import { hasSectionContent } from './is-section-of-type';
import { postTypes } from '@/api/posts';

function textSection(content: string): postTypes.PostTextSection {
  return {
    type: postTypes.POST_SECTION_TYPES.TEXT,
    hash: 'text-hash',
    content,
  };
}

function pictureSection(url: string): postTypes.PostPictureSection {
  return {
    type: postTypes.POST_SECTION_TYPES.PICTURE,
    hash: 'pic-hash',
    url,
  };
}

function videoSection(url: string): postTypes.PostVideoSection {
  return {
    type: postTypes.POST_SECTION_TYPES.VIDEO,
    hash: 'vid-hash',
    url,
  };
}

describe('hasSectionContent', () => {
  it('returns true for a text section with non-empty content', () => {
    expect(hasSectionContent(textSection('Some text'))).toBe(true);
  });

  it('returns false for a text section with whitespace-only content', () => {
    expect(hasSectionContent(textSection('   \n\t '))).toBe(false);
  });

  it('returns false for a text section with empty content', () => {
    expect(hasSectionContent(textSection(''))).toBe(false);
  });

  it('returns true for a picture section with a url', () => {
    expect(
      hasSectionContent(pictureSection('https://example.com/img.png')),
    ).toBe(true);
  });

  it('returns false for a picture section without a url', () => {
    expect(hasSectionContent(pictureSection(''))).toBe(false);
  });

  it('returns true for a video section with a url', () => {
    expect(hasSectionContent(videoSection('https://example.com/video'))).toBe(
      true,
    );
  });

  it('returns false for a video section without a url', () => {
    expect(hasSectionContent(videoSection(''))).toBe(false);
  });
});
