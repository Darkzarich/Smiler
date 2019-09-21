/* eslint-disable no-underscore-dangle */
/* eslint-disable func-names */
const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  uploads: [
    {
      type: String,
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
}, {
  timestamps: true,
});

schema.static('commentCountInc', function (postId) {
  return this.findByIdAndUpdate(postId, {
    $inc: { commentCount: 1 },
  }, {
    new: true,
  });
});

schema.static('commentCountDec', function (postId) {
  return this.findByIdAndUpdate(postId, {
    $inc: { commentCount: -1 },
  }, {
    new: true,
  });
});

schema.methods.toResponse = function (user) {
  const rated = user ? user.isRated(this.id) : {};

  return {
    title: this.title,
    body: this.body,
    slug: this.slug,
    author: this.author,
    uploads: this.uploads,
    id: this._id,
    commentCount: this.commentCount,
    rating: this.rating,
    createdAt: this.createdAt,
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
