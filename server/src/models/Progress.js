import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
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
    completedTopics: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    }],
    lastActivityDate: {
      type: String,
      default: '',
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLearningMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    activityDates: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  },
);

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
