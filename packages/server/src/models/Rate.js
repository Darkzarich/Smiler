import mongoose from 'mongoose';

const { Schema } = mongoose;

const schema = new Schema({
  negative: {
    type: Boolean,
    required: true,
  },
  target: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel',
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Comment', 'Post'],
  },
});

export default mongoose.model('Rate', schema);
