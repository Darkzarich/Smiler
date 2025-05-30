import {
  prop,
  getModelForClass,
  type Ref,
  index,
  modelOptions,
  type DocumentType,
  isDocumentArray,
  Severity,
} from '@typegoose/typegoose';
import mongoose, { ObjectId } from 'mongoose';
import { Rate } from '@models/Rate';
import { PostSection } from '@models/Post';
import { USER_MAX_AVATAR_LENGTH, USER_MAX_BIO_LENGTH } from '@constants/index';

export interface UserTemplate {
  sections: PostSection[];
  tags: string[];
  title: string;
}

export type UserDocument = DocumentType<User>;

@index({ login: 1, email: 1 }, { unique: true, background: true })
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
    match: [/^https?:\/\//, '{VALUE} is not an url'],
    maxlength: USER_MAX_AVATAR_LENGTH,
    default: '',
  })
  public avatar!: string;

  @prop({ maxlength: USER_MAX_BIO_LENGTH, default: '' })
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
    allowMixed: Severity.ALLOW,
    type: () => mongoose.Schema.Types.Mixed,
  })
  public template!: UserTemplate;

  @prop()
  public createdAt!: Date;

  public isRated(this: UserDocument, id: string | ObjectId) {
    if (!isDocumentArray(this.rates)) {
      return {
        result: false,
      };
    }

    const rated = this.rates.find(
      (el) => el.target.toString() === id.toString(),
    );

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
