import { faker } from '@faker-js/faker';
import defaults from 'lodash/defaults';

function createTextSection() {
  return {
    type: 'text',
    hash: faker.string.uuid(),
    content: faker.lorem.sentence(),
  };
}

function createPicSection() {
  return {
    type: 'pic',
    hash: faker.string.uuid(),
    url: 'https://placehold.co/600x400',
  };
}

function createVideoSection() {
  return {
    type: 'vid',
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
export default function createSection(overrides = {}) {
  const type =
    overrides.type || faker.helpers.arrayElement(['text', 'pic', 'vid']);

  const newSection = createSectionFns[type]();

  if (!overrides) {
    return newSection;
  }

  return defaults(overrides, newSection);
}
