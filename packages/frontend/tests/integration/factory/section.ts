import { faker } from '@faker-js/faker';
import defaults from 'lodash-es/defaults';
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

const createSectionFns = {
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
export default function createSection(
  overrides: Partial<postTypes.PostSection> = {},
) {
  const type =
    overrides.type || faker.helpers.arrayElement(['text', 'pic', 'vid']);

  const newSection = createSectionFns[type]();

  if (!overrides) {
    return newSection;
  }

  return defaults(overrides, newSection);
}
