import {
  prop,
  getModelForClass,
  type Ref,
  index,
  pre,
  modelOptions,
  Severity,
} from '@typegoose/typegoose';
import mongoose, { Types } from 'mongoose';
import type { PostSection } from '@models/Post';
import { USER_MAX_AVATAR_LENGTH, USER_MAX_BIO_LENGTH } from '@constants/index';

export interface UserTemplate {
  sections: PostSection[];
  tags: string[];
  title: string;
}

export interface PopulatedAuthor extends Pick<User, 'login' | 'avatar'> {
  _id: Types.ObjectId;
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
}

export function isUserFollowed(
  usersFollowed: Types.ObjectId[] | undefined,
  id: string,
): boolean {
  if (!usersFollowed) {
    return false;
  }

  return usersFollowed.some((el) => el.toString() === id);
}

export function isAuthorPopulated(
  author: Types.ObjectId | PopulatedAuthor,
): author is PopulatedAuthor {
  return (
    author != null &&
    typeof author === 'object' &&
    !(author instanceof Types.ObjectId)
  );
}

export const UserModel = getModelForClass(User);
