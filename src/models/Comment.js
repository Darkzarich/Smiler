const mongoose = require('mongoose');

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
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});


module.exports = mongoose.model('Comment', schema);
