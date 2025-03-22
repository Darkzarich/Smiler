import {
  prop,
  getModelForClass,
  Ref,
  index,
  modelOptions,
  plugin,
  DocumentType,
} from '@typegoose/typegoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';
import { Post } from './Post';
import { User } from './User';

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
  @prop({ default: false })
  public deleted!: boolean;

  @prop({ required: true })
  public body!: string;

  @prop({ required: true })
  public post!: Ref<Post>;

  @prop({ ref: () => Comment, default: [] })
  public children!: Ref<Comment>[];

  @prop({ ref: () => Comment })
  public parent!: Ref<Comment>;

  @prop({ ref: () => User, required: true })
  public author!: Ref<User>;

  @prop({ default: 0 })
  public rating!: number;

  public createdAt!: string;
  public updatedAt!: string;

  public toResponse(
    this: DocumentType<Comment>,
    user?: DocumentType<User> | null,
  ) {
    if (this.deleted) {
      return {
        author: this.author,
        children: this.children,
        id: this._id,
        deleted: true,
        parent: this.parent,
        createdAt: this.createdAt,
      };
    }

    const rated = user ? user.isRated(this._id.toString()) : null;

    return {
      body: this.body,
      author: this.author,
      children: this.children,
      id: this._id,
      parent: this.parent,
      rating: this.rating,
      createdAt: this.createdAt,
      rated: rated
        ? {
            isRated: rated.result,
            negative: rated.negative,
          }
        : {
            isRated: false,
            negative: false,
          },
      deleted: false,
    };
  }
}

export const CommentModel = getModelForClass(Comment);
