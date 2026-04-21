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

@index({ post: 1 })
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

  // TODO: Come up with a better solution for this autopopulate
  @prop({ ref: () => Comment, default: [], autopopulate: { maxDepth: 20 } })
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
  children: LeanComment[];
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
      children: comment.children ?? [],
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
    children: comment.children ?? [],
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

export type CommentResponse = ReturnType<typeof commentToResponse>;

export const CommentModel = getModelForClass(Comment);
