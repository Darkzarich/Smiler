import {
  prop,
  getModelForClass,
  type Ref,
  index,
  modelOptions,
} from '@typegoose/typegoose';
import { Comment } from './Comment';
import { Post } from './Post';

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
export class Rate {
  @prop({ default: false, type: Boolean })
  public negative!: boolean;

  @prop({ required: true, refPath: 'targetModel' })
  public target!: Ref<Post | Comment>;

  @prop({ required: true })
  public targetModel!: 'Comment' | 'Post';
}

export const RateModel = getModelForClass(Rate);
