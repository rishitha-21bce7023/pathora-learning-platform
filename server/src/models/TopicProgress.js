import mongoose from 'mongoose';

const topicProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'courseId is required'],
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: [true, 'topicId is required'],
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

topicProgressSchema.index({ userId: 1, courseId: 1, topicId: 1 }, { unique: true });

const TopicProgress = mongoose.model('TopicProgress', topicProgressSchema);

export default TopicProgress;
