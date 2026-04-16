import {
  prop,
  getModelForClass,
  type Ref,
  index,
  pre,
  modelOptions,
  Severity,
} from '@typegoose/typegoose';
import mongoose from 'mongoose';
import type { PostSection } from '@models/Post';
import { USER_MAX_AVATAR_LENGTH, USER_MAX_BIO_LENGTH } from '@constants/index';

export interface UserTemplate {
  sections: PostSection[];
  tags: string[];
  title: string;
}

@index({ login: 1 }, { unique: true, background: true })
@index({ email: 1 }, { unique: true, background: true })
@pre<User>('save', function normalizeUserFields() {
  if (this.login) {
    this.login = this.login.trim();
  }
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }
})
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

  public isFollowed(id: string) {
    return Boolean(
      this.usersFollowed.find((el) => el.toString() === id.toString()),
    );
  }
}

export const UserModel = getModelForClass(User);
