import {
  prop,
  getModelForClass,
  type Ref,
  index,
  modelOptions,
  type ReturnModelType,
  type DocumentType,
  isDocument,
  mongoose,
  Severity,
} from '@typegoose/typegoose';
import { User } from '@models/User';

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
      virtuals: true,
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

  public toResponse(
    this: DocumentType<Post>,
    user?: DocumentType<User> | null,
  ) {
    const rated = user ? user.isRated(this._id.toString()) : null;

    return {
      title: this.title,
      sections: this.sections,
      slug: this.slug,
      author: isDocument(this.author)
        ? {
            id: this.author._id,
            login: this.author.login,
            avatar: this.author.avatar,
          }
        : null,
      id: this._id,
      commentCount: this.commentCount,
      rating: this.rating,
      createdAt: this.createdAt,
      tags: this.tags,
      rated: rated
        ? {
            isRated: rated.result,
            negative: rated.negative,
          }
        : {
            isRated: false,
            negative: false,
          },
    };
  }

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
      },
    );
  }

  public static decreaseCommentCount(
    this: ReturnModelType<typeof Post>,
    postId: string,
  ) {
    return this.findByIdAndUpdate(
      postId,
      {
        $inc: { commentCount: -1 },
      },
      {
        new: true,
      },
    );
  }
}

export const PostModel = getModelForClass(Post);
