/* eslint-disable func-names */
import mongoose from 'mongoose';
import {
  USER_MAX_AVATAR_LENGTH,
  USER_MAX_BIO_LENGTH,
} from '../constants/index';

const { Schema } = mongoose;

const schema = new Schema(
  {
    login: {
      type: String,
      required: [true, "can't be blank."],
    },
    email: {
      type: String,
      required: [true, "can't be blank."],
    },
    hash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      match: [/^https?:\/\//, '{VALUE} is not an url'],
      maxlength: USER_MAX_AVATAR_LENGTH,
      default: '',
    },
    bio: {
      type: String,
      maxlength: USER_MAX_BIO_LENGTH,
      default: '',
    },
    salt: {
      type: String,
      require: true,
    },
    template: {
      type: Schema.Types.Mixed,
      default: {
        title: '',
        tags: [],
        sections: [],
      },
    },
    rating: {
      type: Number,
      default: 0,
    },
    rates: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Rate',
      },
    ],
    followersAmount: {
      type: Number,
      default: 0,
    },
    tagsFollowed: [
      {
        type: Schema.Types.String,
      },
    ],
    usersFollowed: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  },
);

schema.index({ login: 1 }, { unique: true, background: true });

schema.index({ email: 1 }, { unique: true, background: true });

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

schema.methods.isRated = function (id) {
  const rated = this.rates.find((el) => el.target.toString() === id);
  if (rated) {
    return {
      result: true,
      rated,
      negative: rated.negative,
    };
  }
  return {
    result: false,
  };
};

schema.methods.isFollowed = function (id) {
  const followedUser = this.usersFollowed.find(
    (el) => el.toString() === id.toString(),
  );

  return !!followedUser;
};

export default mongoose.model('User', schema);
