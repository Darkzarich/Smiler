import {
  prop,
  getModelForClass,
  type Ref,
  type ReturnModelType,
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
@index({ replyTo: 1 }, { sparse: true })
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

  @prop({ ref: () => Comment })
  public parent!: Ref<Comment>;

  /** Set when the comment answered was too deep to nest under, see `COMMENT_MAX_DEPTH`;
   * `parent` is then an ancestor of it. */
  @prop({ ref: () => Comment })
  public replyTo?: Ref<Comment>;

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

  public static async hasReplies(
    this: ReturnModelType<typeof Comment>,
    commentId: Types.ObjectId,
  ) {
    return (
      (await this.exists({
        $or: [{ parent: commentId }, { replyTo: commentId }],
      })) !== null
    );
  }

  /** `replyTo` the way the API sends it, for a single comment outside the list */
  public static async findReplyTo(
    this: ReturnModelType<typeof Comment>,
    commentId: Types.ObjectId,
  ): Promise<ReplyTo> {
    const comment = await this.findById(commentId)
      .select({ author: 1, deleted: 1 })
      .populate<{ author: PopulatedAuthor | null }>({
        path: 'author',
        select: { login: 1 },
      })
      .lean();

    return {
      _id: commentId,
      login: comment && !comment.deleted ? comment.author?.login ?? null : null,
    };
  }
}

export interface LeanComment
  extends Pick<
    Comment,
    'body' | 'rating' | 'deleted' | 'createdAt' | 'updatedAt'
  > {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  parent?: Types.ObjectId;
  replyTo?: Types.ObjectId;
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

export interface ReplyTo {
  _id: Types.ObjectId;
  /** Null once the comment answered is deleted */
  login: string | null;
}

export type CommentResponse = ReturnType<typeof commentToResponse> & {
  children: CommentResponse[];
  replyTo?: ReplyTo;
};

export const CommentModel = getModelForClass(Comment);
