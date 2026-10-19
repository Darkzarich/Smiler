import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import Sharp from 'sharp';
import {
  BASE_UPLOAD_FOLDER,
  POST_MAX_IMAGE_HEIGHT,
  POST_MAX_IMAGE_WIDTH,
  USER_AVATAR_SIZE,
} from '@constants/index';
import type { Random } from './random';

const PALETTES = [
  ['#ff9a8b', '#ff6a88'],
  ['#a1c4fd', '#c2e9fb'],
  ['#84fab0', '#8fd3f4'],
  ['#fccb90', '#d57eeb'],
  ['#f6d365', '#fda085'],
  ['#667eea', '#764ba2'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
];

/**
 * The pictures are drawn rather than downloaded, so seeding works offline and
 * the files land exactly where an upload would put them. No text is drawn: an
 * SVG `<text>` needs fonts that a slim container does not have.
 */
function gradient(random: Random) {
  const [from, to] = random.pick(PALETTES);

  return `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>`;
}

function postPictureSvg(random: Random, width: number, height: number) {
  const circles = Array.from({ length: random.int(3, 7) }, () => {
    const radius = random.int(20, Math.round(width / 2));

    return `<circle cx="${random.int(0, width)}" cy="${random.int(0, height)}" r="${radius}" fill="#fff" fill-opacity="${(random.int(10, 35) / 100).toFixed(2)}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${gradient(random)}<rect width="100%" height="100%" fill="url(#g)"/>${circles}
  </svg>`;
}

/** A smiley, it is the name of the place */
function avatarSvg(random: Random) {
  const size = USER_AVATAR_SIZE;
  const mouth = random.pick([
    'M60 120 Q100 160 140 120',
    'M65 125 Q100 145 135 125',
    'M70 130 L130 130',
  ]);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    ${gradient(random)}<rect width="100%" height="100%" fill="url(#g)"/>
    <circle cx="70" cy="80" r="12" fill="#222"/><circle cx="130" cy="80" r="12" fill="#222"/>
    <path d="${mouth}" stroke="#222" stroke-width="10" fill="none" stroke-linecap="round"/>
  </svg>`;
}

async function writePicture(userId: string, svg: string) {
  const destination = join(process.cwd(), BASE_UPLOAD_FOLDER, userId);
  const filename = `${randomUUID()}.jpg`;

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await mkdir(destination, { recursive: true });

  await Sharp(Buffer.from(svg))
    .jpeg({ quality: 70, progressive: true })
    .toFile(join(destination, filename));

  return `${BASE_UPLOAD_FOLDER}/${userId}/${filename}`;
}

/** Same bounds the post picture upload resizes into */
export function writePostPicture(userId: string, random: Random) {
  const isPortrait = random.chance(0.3);
  const width = POST_MAX_IMAGE_WIDTH;
  const height = isPortrait
    ? POST_MAX_IMAGE_HEIGHT
    : Math.round(POST_MAX_IMAGE_WIDTH * 0.66);

  return writePicture(userId, postPictureSvg(random, width, height));
}

export function writeAvatar(userId: string, random: Random) {
  return writePicture(userId, avatarSvg(random));
}
