import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { hoursToMilliseconds, minutesToMilliseconds } from 'date-fns';
import mongoose, { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import slugLib from 'slug';
import Config from '@config/index';
import {
  BASE_UPLOAD_FOLDER,
  COMMENT_AUTHOR_RATING_SHARE,
  COMMENT_RATE_VALUE,
  POST_RATE_VALUE,
} from '@constants/index';
import { connectDB } from '@libs/db';
import { logger } from '@libs/logger';
import sanitizeHtml, { SanitizeHtmlProfile } from '@libs/sanitize-html';
import { CommentModel } from '@models/Comment';
import {
  POST_SECTION_TYPES,
  PostModel,
  type PostPictureSection,
  type PostSection,
} from '@models/Post';
import { RateModel, RateTargetModel } from '@models/Rate';
import { UserModel } from '@models/User';
import { hashPassword, type PasswordHashParams } from '@utils/password';
import {
  BIOS,
  COMMENTS,
  LIST_ITEMS,
  LOGIN_ADJECTIVES,
  LOGIN_NOUNS,
  QUOTES,
  REPLIES,
  SENTENCES,
  TAGS,
  TITLE_OPENERS,
  TITLE_SUBJECTS,
  VIDEO_URLS,
} from './content';
import { writeAvatar, writePostPicture } from './pictures';
import { createRandom, type Random } from './random';

const RANDOM_SEED = 1337;

const daysInMs = (days: number) => hoursToMilliseconds(days * 24);

/** Every user signs in with this password, the demo one included */
const PASSWORD = 'password';
const DEMO_LOGIN = 'demo';

/** A "blowing" post needs 50 net upvotes, so there have to be more voters
 * than that once its author is left out. */
const USER_COUNT = 64;

/** Server-assigned, the same length the post validator hands out */
const SECTION_HASH_LENGTH = 4;

/**
 * How old the posts are, so that each category page has something on it:
 * blowing (the last hour, rating 50+), recent (the last two hours), today,
 * this week, and the long tail that only "all" and the profiles show.
 */
const POST_AGE_BUCKETS = [
  {
    count: 4,
    from: minutesToMilliseconds(5),
    to: minutesToMilliseconds(40),
    isHot: true,
  },
  { count: 10, from: minutesToMilliseconds(5), to: hoursToMilliseconds(2) },
  { count: 26, from: hoursToMilliseconds(2), to: hoursToMilliseconds(20) },
  { count: 40, from: daysInMs(1), to: daysInMs(7) },
  { count: 70, from: daysInMs(7), to: daysInMs(60) },
];

interface SeedUser {
  _id: Types.ObjectId;
  login: string;
  email: string;
  hash: string;
  salt: string;
  hashParams: PasswordHashParams;
  avatar: string;
  bio: string;
  rating: number;
  followersAmount: number;
  tagsFollowed: string[];
  usersFollowed: Types.ObjectId[];
  createdAt: Date;
  lastLoginAt: Date;
}

interface SeedPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  author: Types.ObjectId;
  sections: PostSection[];
  tags: string[];
  rating: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  /** Not stored: how likely any one user is to upvote it */
  popularity: number;
}

interface SeedComment {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  parent?: Types.ObjectId;
  children: Types.ObjectId[];
  rating: number;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SeedRate {
  user: Types.ObjectId;
  target: Types.ObjectId;
  targetModel: RateTargetModel;
  negative: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MODELS = [UserModel, PostModel, CommentModel, RateModel] as const;

function parseOptions() {
  const { values } = parseArgs({
    options: { reset: { type: 'boolean', default: false } },
  });

  return values;
}

function randomDateBetween(random: Random, from: Date, to: Date) {
  return new Date(
    from.getTime() + random.next() * (to.getTime() - from.getTime()),
  );
}

/**
 * Seeding into a database that already has users would mix two sets of
 * accounts and leave counters (ratings, comment counts) that no longer add up,
 * so it either starts from empty or is told to make it empty.
 *
 * Returns whether seeding may go ahead.
 */
async function prepareDatabase(reset: boolean) {
  // Builds the indexes first, so the unique ones guard the inserts below
  await Promise.all(MODELS.map((model) => model.init()));

  const counts = await Promise.all(
    MODELS.map((model) => model.estimatedDocumentCount()),
  );

  if (counts.every((count) => count === 0)) {
    return true;
  }

  if (!reset) {
    logger.error('seed_database_not_empty', {
      users: counts[0],
      posts: counts[1],
      comments: counts[2],
      rates: counts[3],
      hint: 'run again with --reset to delete them first',
    });

    return false;
  }

  // The uploads of a deleted user are unreachable, whoever wrote them
  const users = await UserModel.find().select({ _id: 1 }).lean();

  await Promise.all(
    users.map(({ _id: id }) =>
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      rm(join(process.cwd(), BASE_UPLOAD_FOLDER, id.toString()), {
        recursive: true,
        force: true,
      }),
    ),
  );

  await Promise.all([
    UserModel.deleteMany({}),
    PostModel.deleteMany({}),
    CommentModel.deleteMany({}),
    RateModel.deleteMany({}),
  ]);

  logger.info('seed_database_reset', {
    users: counts[0],
    posts: counts[1],
    comments: counts[2],
    rates: counts[3],
  });

  return true;
}

function buildLogins(random: Random) {
  const combinations = LOGIN_ADJECTIVES.flatMap((adjective) =>
    LOGIN_NOUNS.map((noun) => `${adjective}${noun}`),
  );

  return [DEMO_LOGIN, ...random.sample(combinations, USER_COUNT - 1)];
}

async function buildUsers(random: Random, now: Date) {
  // One derivation for everyone: at the current params it takes long enough
  // that hashing the same password sixty times would be most of the run.
  const { hash, salt, hashParams } = await hashPassword(PASSWORD);
  const pictures: Promise<void>[] = [];

  const users = buildLogins(random).map((login): SeedUser => {
    const user: SeedUser = {
      _id: new Types.ObjectId(),
      login,
      email: `${login}@example.com`,
      hash,
      salt,
      hashParams,
      avatar: '',
      bio: random.chance(0.6) ? random.pick(BIOS) : '',
      rating: 0,
      followersAmount: 0,
      tagsFollowed: [],
      usersFollowed: [],
      createdAt: randomDateBetween(
        random,
        new Date(now.getTime() - daysInMs(90)),
        new Date(now.getTime() - daysInMs(61)),
      ),
      lastLoginAt: randomDateBetween(
        random,
        new Date(now.getTime() - daysInMs(7)),
        now,
      ),
    };

    if (login === DEMO_LOGIN || random.chance(0.75)) {
      pictures.push(
        writeAvatar(user._id.toString(), random).then((url) => {
          user.avatar = url;
        }),
      );
    }

    return user;
  });

  await Promise.all(pictures);

  return users;
}

function textContent(random: Random) {
  const blocks = Array.from(
    { length: random.int(1, 3) },
    () => `<p>${random.sample(SENTENCES, random.int(2, 4)).join(' ')}</p>`,
  );

  if (random.chance(0.2)) {
    const items = random
      .sample(LIST_ITEMS, 3)
      .map((item) => `<li>${item}</li>`);

    blocks.push(`<p>What you need:</p><ul>${items.join('')}</ul>`);
  }

  if (random.chance(0.15)) {
    blocks.push(`<blockquote><p>${random.pick(QUOTES)}</p></blockquote>`);
  }

  // Stored the way the post validator would store it
  return sanitizeHtml(blocks.join(''), SanitizeHtmlProfile.Post);
}

/** A text section first, as the editor starts with, then whatever follows */
function buildSections(
  random: Random,
  authorId: string,
  pictures: Promise<void>[],
) {
  const sections: PostSection[] = [
    {
      type: POST_SECTION_TYPES.TEXT,
      content: textContent(random),
      hash: nanoid(SECTION_HASH_LENGTH),
    },
  ];

  for (let i = random.int(0, 3); i > 0; i -= 1) {
    const type = random.pick([
      POST_SECTION_TYPES.TEXT,
      POST_SECTION_TYPES.PICTURE,
      POST_SECTION_TYPES.PICTURE,
      POST_SECTION_TYPES.VIDEO,
    ]);
    const hash = nanoid(SECTION_HASH_LENGTH);
    const spoiler = random.chance(0.1) ? { isSpoiler: true } : {};

    if (type === POST_SECTION_TYPES.TEXT) {
      sections.push({ type, content: textContent(random), hash, ...spoiler });
    } else if (type === POST_SECTION_TYPES.VIDEO) {
      sections.push({ type, url: random.pick(VIDEO_URLS), hash, ...spoiler });
    } else {
      const section: PostPictureSection = {
        type,
        url: '',
        isFile: true,
        hash,
        ...spoiler,
      };

      pictures.push(
        writePostPicture(authorId, random).then((url) => {
          section.url = url;
        }),
      );
      sections.push(section);
    }
  }

  return sections;
}

async function buildPosts(random: Random, users: SeedUser[], now: Date) {
  const demoUser = users[0];
  const pictures: Promise<void>[] = [];
  let index = 0;

  const posts = POST_AGE_BUCKETS.flatMap((bucket) =>
    Array.from({ length: bucket.count }, (): SeedPost => {
      index += 1;

      // A handful for the demo account, so its profile is not empty
      const author = index % 30 === 7 ? demoUser : random.pick(users);
      const title = `${random.pick(TITLE_OPENERS)} ${random.pick(TITLE_SUBJECTS)}`;
      const createdAt = new Date(
        now.getTime() - bucket.from - random.next() * (bucket.to - bucket.from),
      );

      return {
        _id: new Types.ObjectId(),
        title,
        slug: `${slugLib(title)}-${nanoid(3)}`,
        author: author._id,
        sections: buildSections(random, author._id.toString(), pictures),
        tags: random.sample(TAGS, random.int(1, 4)),
        rating: 0,
        commentCount: 0,
        createdAt,
        updatedAt: createdAt,
        // Skewed, so most posts get a few votes and a few get a lot
        popularity: bucket.isHot ? 0.97 : random.next() ** 2 * 0.8,
      };
    }),
  );

  await Promise.all(pictures);

  return posts;
}

function buildComments(
  random: Random,
  posts: SeedPost[],
  users: SeedUser[],
  now: Date,
) {
  return posts.flatMap((post) => {
    const comments: SeedComment[] = [];
    const count = random.int(0, 3 + Math.round(post.popularity * 12));

    for (let i = 0; i < count; i += 1) {
      const parent =
        comments.length > 0 && random.chance(0.45)
          ? random.pick(comments)
          : undefined;
      const createdAt = randomDateBetween(
        random,
        parent?.createdAt ?? post.createdAt,
        now,
      );
      const comment: SeedComment = {
        _id: new Types.ObjectId(),
        post: post._id,
        author: random.pick(users)._id,
        body: sanitizeHtml(
          `<p>${random.pick(parent ? REPLIES : COMMENTS)}</p>`,
          SanitizeHtmlProfile.Comment,
        ),
        ...(parent && { parent: parent._id }),
        children: [],
        rating: 0,
        deleted: false,
        createdAt,
        updatedAt: createdAt,
      };

      parent?.children.push(comment._id);
      comments.push(comment);
    }

    // eslint-disable-next-line no-param-reassign
    post.commentCount = comments.length;

    return comments;
  });
}

/**
 * Casts the votes and moves every rating the way the vote endpoints do: the
 * target by the vote's value, and its author by the same amount.
 */
function castVotes(
  random: Random,
  {
    posts,
    comments,
    users,
  }: { posts: SeedPost[]; comments: SeedComment[]; users: SeedUser[] },
  now: Date,
) {
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));
  const rates: SeedRate[] = [];

  const vote = (
    target: SeedPost | SeedComment,
    targetModel: RateTargetModel,
    voter: SeedUser,
    negative: boolean,
  ) => {
    const isPost = targetModel === RateTargetModel.POST;
    const value = isPost ? POST_RATE_VALUE : COMMENT_RATE_VALUE;
    const delta = negative ? -value : value;
    const createdAt = randomDateBetween(random, target.createdAt, now);

    // eslint-disable-next-line no-param-reassign
    target.rating += delta;
    usersById.get(target.author.toString())!.rating += isPost
      ? delta
      : delta * COMMENT_AUTHOR_RATING_SHARE;
    rates.push({
      user: voter._id,
      target: target._id,
      targetModel,
      negative,
      createdAt,
      updatedAt: createdAt,
    });
  };

  posts.forEach((post) => {
    users.forEach((voter) => {
      if (voter._id.equals(post.author)) {
        return;
      }

      if (random.chance(post.popularity)) {
        vote(post, RateTargetModel.POST, voter, false);
      } else if (random.chance(0.04)) {
        vote(post, RateTargetModel.POST, voter, true);
      }
    });
  });

  comments.forEach((comment) => {
    const voters = random
      .sample(users, random.int(0, 6))
      .filter((voter) => !voter._id.equals(comment.author));

    voters.forEach((voter) => {
      vote(comment, RateTargetModel.COMMENT, voter, random.chance(0.25));
    });
  });

  return rates;
}

function followEachOther(random: Random, users: SeedUser[]) {
  users.forEach((user) => {
    const isDemo = user.login === DEMO_LOGIN;
    const others = users.filter((other) => other !== user);
    const followed = random.sample(others, isDemo ? 12 : random.int(0, 8));

    /* eslint-disable no-param-reassign */
    user.usersFollowed = followed.map((other) => other._id);
    user.tagsFollowed = random.sample(TAGS, isDemo ? 4 : random.int(0, 4));
    followed.forEach((other) => {
      other.followersAmount += 1;
    });
    /* eslint-enable no-param-reassign */
  });
}

async function insertSeedData(reset: boolean) {
  if (!(await prepareDatabase(reset))) {
    return false;
  }

  const random = createRandom(RANDOM_SEED);
  const now = new Date();

  const users = await buildUsers(random, now);
  const posts = await buildPosts(random, users, now);
  const comments = buildComments(random, posts, users, now);
  const rates = castVotes(random, { posts, comments, users }, now);

  followEachOther(random, users);

  // One after the other, so a failure leaves nothing that refers to a missing
  // document. `insertMany` keeps the backdated timestamps, `create` would not
  // be told to.
  await UserModel.insertMany(users);
  await PostModel.insertMany(posts.map(({ popularity, ...post }) => post));
  await CommentModel.insertMany(comments);
  await RateModel.insertMany(rates);

  logger.info('seed_completed', {
    users: users.length,
    posts: posts.length,
    comments: comments.length,
    rates: rates.length,
    login: DEMO_LOGIN,
    email: users[0].email,
    password: PASSWORD,
  });

  return true;
}

async function seed() {
  if (Config.IS_PRODUCTION) {
    logger.error('seed_refused_in_production');
    process.exitCode = 1;

    return;
  }

  const { reset } = parseOptions();

  await connectDB();

  try {
    if (!(await insertSeedData(reset))) {
      process.exitCode = 1;
    }
  } finally {
    // `connectDB` warns on a disconnect, which here is the plan, not a fault
    mongoose.connection.removeAllListeners('disconnected');
    await mongoose.disconnect();
  }
}

seed().catch((error: unknown) => {
  logger.error('seed_failed', { error });
  process.exitCode = 1;
});
