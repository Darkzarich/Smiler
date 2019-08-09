const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
}, {
  timestamps: true,
});

schema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('Post', schema);
