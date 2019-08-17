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
  commentCount: {
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

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});


module.exports = mongoose.model('Post', schema);
