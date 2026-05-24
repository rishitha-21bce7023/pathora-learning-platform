import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    answers: {
      type: [
        {
          questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'QuizQuestion',
            required: true,
          },
          selectedAnswer: {
            type: String,
            trim: true,
            default: '',
          },
          isCorrect: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

export default QuizResult;
