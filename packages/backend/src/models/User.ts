import {
  prop,
  getModelForClass,
  type Ref,
  index,
  modelOptions,
  type DocumentType,
  isDocumentArray,
} from '@typegoose/typegoose';
import { ObjectId } from 'mongoose';
import {
  USER_MAX_AVATAR_LENGTH,
  USER_MAX_BIO_LENGTH,
} from '../constants/index';
import { Rate } from './Rate';
import { PostSection } from './Post';

export interface UserTemplate {
  sections: PostSection[];
  tags: string[];
  title: string;
}

export type UserDocument = DocumentType<User>;

@index({ login: 1 }, { unique: true, background: true })
@index({ email: 1 }, { unique: true, background: true })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
  },
})
export class User {
  @prop({ required: true })
  public login!: string;

  @prop({ required: true })
  public email!: string;

  @prop({ required: true })
  public hash!: string;

  @prop({
    required: true,
    match: [/^https?:\/\//, '{VALUE} is not an url'],
    maxlength: USER_MAX_AVATAR_LENGTH,
  })
  public avatar!: string;

  @prop({ required: true, maxlength: USER_MAX_BIO_LENGTH })
  public bio!: string;

  @prop({ required: true })
  public salt!: string;

  @prop({ default: 0 })
  public rating!: number;

  @prop({ ref: () => Rate, default: [] })
  public rates!: Ref<Rate>[];

  @prop({ default: 0 })
  public followersAmount!: number;

  @prop({ type: () => String, default: [] })
  public tagsFollowed!: string[];

  @prop({ ref: () => User, default: [] })
  public usersFollowed!: Ref<User>[];

  @prop({
    default: {
      title: '',
      tags: [],
      sections: [],
    },
  })
  public template!: UserTemplate;

  @prop()
  public createdAt!: string;

  public isRated(this: UserDocument, id: string | ObjectId) {
    if (!isDocumentArray(this.rates)) {
      return {
        result: false,
      };
    }

    const rated = this.rates.find((el) => el._id.toString() === id.toString());

    if (!rated) {
      return {
        result: false,
      };
    }

    return {
      result: true,
      rated,
      negative: rated.negative,
    };
  }

  public isFollowed(id: string) {
    return Boolean(
      this.usersFollowed.find((el) => el.toString() === id.toString()),
    );
  }
}

export const UserModel = getModelForClass(User);
