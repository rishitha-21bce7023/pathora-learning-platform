import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 2 && value.every((item) => typeof item === 'string' && item.trim());
        },
        message: 'options must include at least two non-empty values',
      },
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
  },
  {
    timestamps: true,
  },
);

const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);

export default QuizQuestion;
