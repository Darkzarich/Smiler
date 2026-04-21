import {
  prop,
  getModelForClass,
  type Ref,
  index,
  modelOptions,
  type ReturnModelType,
  mongoose,
  Severity,
} from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { isAuthorPopulated, PopulatedAuthor, User } from '@models/User';
import type { RatedTargets } from '@models/Rate';

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum POST_SECTION_TYPES {
  PICTURE = 'pic',
  VIDEO = 'vid',
  TEXT = 'text',
}

export interface PostPictureSection {
  type: POST_SECTION_TYPES.PICTURE;
  hash: string;
  url: string;
  isFile?: boolean;
}

interface PostVideoSection {
  type: POST_SECTION_TYPES.VIDEO;
  hash: string;
  url: string;
}

interface PostTextSection {
  type: POST_SECTION_TYPES.TEXT;
  content: string;
  hash: string;
}

export type PostSection =
  | PostPictureSection
  | PostVideoSection
  | PostTextSection;

@index({ slug: 1 }, { unique: true })
@index({ createdAt: -1, rating: -1 })
@index({ rating: -1 })
@index({ createdAt: -1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      versionKey: false,
    },
  },
})
export class Post {
  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public slug!: string;

  @prop({ required: true, ref: () => User })
  public author!: Ref<User>;

  @prop({
    type: () => mongoose.Schema.Types.Mixed,
    default: [],
    allowMixed: Severity.ALLOW,
  })
  public sections!: PostSection[];

  @prop({ default: 0 })
  public rating!: number;

  @prop({ type: String, default: [] })
  public tags!: string[];

  @prop({ default: 0 })
  public commentCount!: number;

  public createdAt!: Date;
  public updatedAt!: Date;

  public static increaseCommentCount(
    this: ReturnModelType<typeof Post>,
    postId: string,
  ) {
    return this.findByIdAndUpdate(
      postId,
      {
        $inc: { commentCount: 1 },
      },
      {
        new: true,
        lean: true,
      },
    );
  }

  public static decreaseCommentCount(
    this: ReturnModelType<typeof Post>,
    postId: string,
  ) {
    return this.findOneAndUpdate(
      { _id: postId, commentCount: { $gt: 0 } },
      {
        $inc: { commentCount: -1 },
      },
      {
        new: true,
        lean: true,
      },
    );
  }
}

interface LeanPost
  extends Pick<
    Post,
    | 'title'
    | 'slug'
    | 'sections'
    | 'rating'
    | 'tags'
    | 'commentCount'
    | 'createdAt'
    | 'updatedAt'
  > {
  _id: Types.ObjectId;
  author: Types.ObjectId | PopulatedAuthor;
}

export function postToResponse(post: LeanPost, ratedTargets?: RatedTargets) {
  const postId = post._id.toString();
  const isRated = ratedTargets?.has(postId) ?? false;

  return {
    _id: post._id,
    title: post.title,
    sections: post.sections,
    slug: post.slug,
    author: isAuthorPopulated(post.author) ? post.author : null,
    commentCount: post.commentCount,
    rating: post.rating,
    createdAt: post.createdAt,
    tags: post.tags,
    rated: {
      isRated,
      negative: ratedTargets?.get(postId) ?? false,
    },
  };
}

export type PostResponse = ReturnType<typeof postToResponse>;

export const PostModel = getModelForClass(Post);
