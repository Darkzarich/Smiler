import {
  prop,
  getModelForClass,
  type Ref,
  index,
  modelOptions,
  plugin,
  type DocumentType,
} from '@typegoose/typegoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { Post } from '@models/Post';
import { User } from '@models/User';
import type { RatedTargets } from '@models/Rate';

export type CommentDocument = DocumentType<Comment>;

@index({ post: 1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
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

  public toResponse(this: CommentDocument, ratedTargets?: RatedTargets) {
    if (this.deleted) {
      return {
        children: this.children,
        id: this._id,
        deleted: true,
        parent: this.parent,
        createdAt: this.createdAt,
      };
    }

    const rated = ratedTargets?.get(this._id.toString());

    return {
      body: this.body,
      author: this.author,
      children: this.children,
      id: this._id,
      parent: this.parent,
      rating: this.rating,
      createdAt: this.createdAt,
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
}

export const CommentModel = getModelForClass(Comment);
