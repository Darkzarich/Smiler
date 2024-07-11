/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    tags: [
      {
        type: Schema.Types.String,
      },
    ],
    sections: [
      {
        // TODO: Describe this type more detailed
        type: Schema.Types.Mixed,
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

schema.index({ slug: 1 }, { unique: true });

schema.index({ createdAt: -1, rating: -1 });

schema.index({ rating: -1 });

schema.index({ createdAt: -1 });

schema.static('commentCountInc', function (postId) {
  return this.findByIdAndUpdate(
    postId,
    {
      $inc: { commentCount: 1 },
    },
    {
      new: true,
    },
  );
});

schema.static('commentCountDec', function (postId) {
  return this.findByIdAndUpdate(
    postId,
    {
      $inc: { commentCount: -1 },
    },
    {
      new: true,
    },
  );
});

schema.methods.toResponse = function (user) {
  const rated = user ? user.isRated(this.id) : {};

  return {
    title: this.title,
    sections: this.sections,
    slug: this.slug,
    author: this.author,
    uploads: this.uploads,
    id: this._id,
    commentCount: this.commentCount,
    rating: this.rating,
    createdAt: this.createdAt,
    tags: this.tags,
    rated: {
      isRated: rated.result || false,
      negative: rated.negative || false,
    },
  };
};

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

module.exports = mongoose.model('Post', schema);
