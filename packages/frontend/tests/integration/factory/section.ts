import { faker } from '@faker-js/faker';
import { defaults } from 'lodash';
import { postTypes } from '@api/posts';

function createTextSection(): postTypes.PostTextSection {
  return {
    type: postTypes.POST_SECTION_TYPES.TEXT,
    hash: faker.string.uuid(),
    content: faker.lorem.sentence(),
  };
}

function createPicSection(): postTypes.PostPictureSection {
  return {
    type: postTypes.POST_SECTION_TYPES.PICTURE,
    hash: faker.string.uuid(),
    url: 'https://placehold.co/600x400',
  };
}

function createVideoSection(): postTypes.PostVideoSection {
  return {
    type: postTypes.POST_SECTION_TYPES.VIDEO,
    hash: faker.string.uuid(),
    url: faker.image.url(),
  };
}

const createRandomSectionFns = {
  text: createTextSection,
  pic: createPicSection,
  vid: createVideoSection,
};

/**
 * Factory function to create a new post section object with optional overrides.
 *
 * @param {object} [overrides] - An object containing properties to override in
 * the new post object.
 * @return {object} The newly generated post object.
 */
export default function createRandomSection<
  T extends postTypes.POST_SECTION_TYPES,
  M extends {
    [postTypes.POST_SECTION_TYPES.TEXT]: postTypes.PostTextSection;
    [postTypes.POST_SECTION_TYPES.PICTURE]: postTypes.PostPictureSection;
    [postTypes.POST_SECTION_TYPES.VIDEO]: postTypes.PostVideoSection;
  },
>(type?: T, overrides: Partial<M[T]> = {}) {
  const _type =
    type ||
    faker.helpers.arrayElement([
      postTypes.POST_SECTION_TYPES.TEXT,
      postTypes.POST_SECTION_TYPES.PICTURE,
      postTypes.POST_SECTION_TYPES.VIDEO,
    ]);

  const newSection = createRandomSectionFns[_type]();

  return defaults(overrides, newSection) as T extends undefined
    ? NonNullable<postTypes.PostSection & Partial<M[T]>>
    : NonNullable<M[T] & Partial<M[T]>>;
}
