const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  login: {
    type: String,
    required: [true, 'can\'t be blank.'],
    unique: true,
  },
  hash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    require: true,
  },
}, {
  timestamps: true,
});

schema.set('toJSON', {
  virtuals: true,
});

module.exports = mongoose.model('User', schema);
