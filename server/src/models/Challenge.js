import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: '',
    },
    expectedOutput: {
      type: String,
      required: true,
      trim: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const challengeSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 180,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 8000,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    starterCode: {
      type: String,
      default: 'print("Hello Pathora")',
    },
    constraints: {
      type: String,
      trim: true,
      default: '',
    },
    examples: {
      type: [
        {
          input: { type: String, default: '' },
          output: { type: String, default: '' },
          explanation: { type: String, default: '' },
        },
      ],
      default: [],
    },
    testCases: {
      type: [testCaseSchema],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one test case is required',
      },
    },
  },
  {
    timestamps: true,
  },
);

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
