/* eslint-disable func-names */
const mongoose = require('mongoose');

const Rate = require('./Rate');

const { Schema } = mongoose;

const schema = new Schema({
  login: {
    type: String,
    required: [true, 'can\'t be blank.'],
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: [true, 'can\'t be blank.'],
    unique: true,
  },
  hash: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
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
}, {
  timestamps: true,
});

schema.set('toJSON', {
  virtuals: true,
  versionKey: false,
});

schema.methods.isRated = function (id) {
  const rated = this.rates.find(el => el.target.toString() === id);
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

schema.methods.deleteSection = async function (sec, cb) {
  await this.updateOne({
    $pull: {
      'template.sections': sec,
    },
  }, cb);
};

module.exports = mongoose.model('User', schema);
