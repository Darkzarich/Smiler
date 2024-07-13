/* eslint-disable func-names */
const mongoose = require('mongoose');
const Post = require('./Post');

const { Schema } = mongoose;

const schema = new Schema({
  deleted: {
    type: Boolean,
    default: false,
  },
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
      autopopulate: {
        maxDepth: 20,
      },
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

schema.index({ post: 1 });

schema.pre('save', async function (next) {
  if (this.isNew) {
    await Post.commentCountInc(this.post);
  }
  next();
});

schema.pre('remove', async function (next) {
  Promise.all([
    this.updateOne(this.parent, {
      $pull: {
        children: this.id,
      },
    }),

    Post.commentCountDec(this.post),
  ])
    .then(() => {
      next();
    })
    .catch((e) => {
      next(e);
    });
});

schema.methods.toResponse = function (user) {
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
    deleted: false,
  };
};

schema.plugin(require('mongoose-autopopulate'));

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

module.exports = mongoose.model('Comment', schema);
