const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  login: {
    type: String,
    required: [true, 'can\'t be blank.'],
    unique: true,
    index: true,
  },
  hash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    require: true,
  },
  template: {
    type: Schema.Types.Mixed,
    default: {
      title: '',
      body: '',
      attachments: [],
    },
  },
}, {
  timestamps: true,
});

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

module.exports = mongoose.model('User', schema);
