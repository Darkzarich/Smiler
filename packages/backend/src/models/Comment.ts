import {
  prop,
  getModelForClass,
  type Ref,
  index,
  modelOptions,
  plugin,
} from '@typegoose/typegoose';
import { Types } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { Post } from '@models/Post';
import { isAuthorPopulated, PopulatedAuthor, User } from '@models/User';
import type { RatedTargets } from '@models/Rate';

// A post's page of top-level comments, in rating order, straight off the index
@index({ post: 1, parent: 1, rating: -1 })
// What $graphLookup follows to find the replies
@index({ parent: 1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    versionKey: false,
  },
})
@plugin(mongooseAutoPopulate)
export class Comment {
  @prop()
  public deleted!: boolean;

  @prop({ required: true })
  public body!: string;

  @prop({ ref: () => Post, required: true })
  public post!: Ref<Post>;

  /** Still written so that the previous release can be rolled back to, but no longer read:
   * replies are found through `parent`, and old documents hold ids of replies deleted since. */
  @prop({ ref: () => Comment, default: [] })
  public children!: Ref<Comment>[];

  @prop({ ref: () => Comment })
  public parent!: Ref<Comment>;

  @prop({
    ref: () => User,
    required: true,
    autopopulate: { maxDepth: 20, select: 'login avatar' },
  })
  public author!: Ref<User>;

  @prop({ default: 0 })
  public rating!: number;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export interface LeanComment
  extends Pick<
    Comment,
    'body' | 'rating' | 'deleted' | 'createdAt' | 'updatedAt'
  > {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  parent?: Types.ObjectId;
  author: Types.ObjectId | PopulatedAuthor;
}

export function commentToResponse(
  comment: LeanComment,
  ratedTargets?: RatedTargets,
) {
  if (comment.deleted) {
    return {
      _id: comment._id,
      deleted: true,
      parent: comment.parent,
      createdAt: comment.createdAt,
    };
  }

  const rated = ratedTargets?.get(comment._id.toString());

  return {
    _id: comment._id,
    body: comment.body,
    author: isAuthorPopulated(comment.author) ? comment.author : null,
    parent: comment.parent,
    rating: comment.rating,
    createdAt: comment.createdAt,
    rated:
      rated !== undefined
        ? {
            isRated: true,
            negative: rated,
          }
        : {
            isRated: false,
          },
    deleted: false,
  };
}

export type CommentResponse = ReturnType<typeof commentToResponse> & {
  children: CommentResponse[];
};

export const CommentModel = getModelForClass(Comment);
