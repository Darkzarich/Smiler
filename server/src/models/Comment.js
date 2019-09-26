/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const mongoose = require('mongoose');
const Post = require('./Post');

const { Schema } = mongoose;

const schema = new Schema({
  body: {
    type: String,
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  children: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      autopopulate: true,
    },
  ],
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    autopopulate: { select: 'login avatar' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number,
    default: 0,
  },
});

schema.pre('save', async function (next) {
  if (this.isNew) {
    await Post.commentCountInc(this.post);
  }
  next();
});

schema.pre('remove', async function (next) {
  Promise.all(
    [
      this.updateOne(this.parent, {
        $pull: {
          children: this.id,
        },
      }),

      Post.commentCountDec(this.post),
    ],
  ).then(() => {
    next();
  });
});

schema.methods.toResponse = function (user) {
  const rated = user ? user.isRated(this.id) : {};

  return {
    body: this.body,
    author: this.author,
    children: this.children,
    id: this._id,
    parent: this.parent,
    rating: this.rating,
    createdAt: this.createdAt,
    rated: {
      isRated: rated.result || false,
      negative: rated.negative || false,
    },
  };
};

schema.plugin(require('mongoose-autopopulate'));

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});


module.exports = mongoose.model('Comment', schema);
