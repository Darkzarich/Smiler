import { postTypes } from '@/api/posts';

export function isTextSection(
  section: postTypes.PostSection,
): section is postTypes.PostTextSection {
  return section.type === postTypes.POST_SECTION_TYPES.TEXT;
}

export function isPictureSection(
  section: postTypes.PostSection,
): section is postTypes.PostPictureSection {
  return section.type === postTypes.POST_SECTION_TYPES.PICTURE;
}

export function isVideoSection(
  section: postTypes.PostSection,
): section is postTypes.PostVideoSection {
  return section.type === postTypes.POST_SECTION_TYPES.VIDEO;
}

export function hasSectionContent(section: postTypes.PostSection): boolean {
  if (isTextSection(section)) {
    return section.content.trim().length > 0;
  }

  return section.url.trim().length > 0;
}
