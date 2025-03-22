import {
  prop,
  getModelForClass,
  Ref,
  index,
  modelOptions,
  ReturnModelType,
  DocumentType,
  isDocument,
} from '@typegoose/typegoose';
import { User } from './User';

export interface PostPictureSection {
  type: 'pic';
  hash: string;
  url: string;
  isFile?: boolean;
}

export interface PostVideoSection {
  type: 'vid';
  hash: string;
  url: string;
}

export interface PostTextSection {
  type: 'text';
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

  @prop({ default: [] })
  public sections!: PostSection[];

  @prop({ default: 0 })
  public rating!: number;

  @prop({ type: String })
  public tags!: string[];

  @prop({ default: 0 })
  public commentCount!: number;

  public createdAt!: string;
  public updatedAt!: string;

  public toResponse(
    this: DocumentType<Post>,
    user?: DocumentType<User> | null,
  ) {
    const rated = user
      ? user.isRated(this.id)
      : {
          isRated: false,
          negative: false,
        };

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
      rated,
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
