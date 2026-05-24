import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'courseId is required'],
      index: true,
    },
    dayNumber: {
      type: Number,
      required: [true, 'dayNumber is required'],
      min: [1, 'dayNumber must be at least 1'],
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true,
      minlength: [3, 'Topic title must be at least 3 characters'],
      maxlength: [160, 'Topic title cannot exceed 160 characters'],
    },
    description: {
      type: String,
      required: [true, 'Topic description is required'],
      trim: true,
      minlength: [10, 'Topic description must be at least 10 characters'],
      maxlength: [1200, 'Topic description cannot exceed 1200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Topic content is required'],
      trim: true,
      minlength: [10, 'Topic content must be at least 10 characters'],
      maxlength: [12000, 'Topic content cannot exceed 12000 characters'],
    },
    estimatedMinutes: {
      type: Number,
      required: [true, 'estimatedMinutes is required'],
      min: [1, 'estimatedMinutes must be at least 1'],
    },
    order: {
      type: Number,
      default: 1,
      min: [1, 'order must be at least 1'],
    },
    practiceLinks: {
      type: [
        {
          title: {
            type: String,
            trim: true,
            required: true,
            maxlength: [120, 'Practice link title cannot exceed 120 characters'],
          },
          url: {
            type: String,
            trim: true,
            required: true,
            maxlength: [1000, 'Practice link URL cannot exceed 1000 characters'],
          },
          platform: {
            type: String,
            trim: true,
            required: true,
            maxlength: [80, 'Practice link platform cannot exceed 80 characters'],
          },
          difficulty: {
            type: String,
            trim: true,
            enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
            default: 'beginner',
          },
        },
      ],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.every((item) => item.title && item.url && item.platform);
        },
        message: 'practiceLinks must contain title, url, and platform',
      },
    },
    notePdfUrl: {
      type: String,
      trim: true,
      default: '',
    },
    noteFileName: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

topicSchema.index({ courseId: 1, order: 1 });

topicSchema.index({ courseId: 1, dayNumber: 1 });

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
