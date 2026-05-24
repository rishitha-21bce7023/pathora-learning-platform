import mongoose from 'mongoose';

const challengeSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: true,
      index: true,
    },
    sourceCode: {
      type: String,
      required: true,
    },
    passedCount: {
      type: Number,
      required: true,
      min: 0,
    },
    failedCount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCount: {
      type: Number,
      required: true,
      min: 0,
    },
    results: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const ChallengeSubmission = mongoose.model('ChallengeSubmission', challengeSubmissionSchema);

export default ChallengeSubmission;
