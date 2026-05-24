import { Router } from 'express';
import mongoose from 'mongoose';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';
import Challenge from '../models/Challenge.js';
import Topic from '../models/Topic.js';
import { sanitizeString } from '../utils/security.js';

const router = Router();
const challengeSubmitRateLimit = createRateLimiter({
  windowMs: Number(process.env.CHALLENGE_RATE_LIMIT_WINDOW_MS || 60 * 1000),
  max: Number(process.env.CHALLENGE_RATE_LIMIT_MAX || 10),
  message: 'Too many challenge submissions. Please wait a moment and try again.',
});

const publicChallenge = (challenge) => {
  return challenge.toObject();
};

const validateChallengePayload = (payload) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(payload.courseId)) {
    errors.push('courseId must be valid');
  }

  if (!mongoose.Types.ObjectId.isValid(payload.topicId)) {
    errors.push('topicId must be valid');
  }

  if (typeof payload.title !== 'string' || payload.title.trim().length < 3) {
    errors.push('title must be at least 3 characters');
  }

  if (typeof payload.description !== 'string' || payload.description.trim().length < 10) {
    errors.push('description must be at least 10 characters');
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(payload.difficulty)) {
    errors.push('difficulty must be beginner, intermediate, or advanced');
  }

  if (!Array.isArray(payload.testCases) || !payload.testCases.length) {
    errors.push('at least one test case is required');
  } else if (payload.testCases.some((testCase) => typeof testCase.expectedOutput !== 'string' || !testCase.expectedOutput.trim())) {
    errors.push('each test case needs expectedOutput');
  }

  return errors;
};

const sanitizeExamples = (examples) => (
  Array.isArray(examples)
    ? examples.map((example) => ({
        input: sanitizeString(example.input, 2000),
        output: sanitizeString(example.output, 2000),
        explanation: sanitizeString(example.explanation, 2000),
      }))
    : []
);

const sanitizeTestCases = (testCases) => testCases.map((testCase) => ({
  input: sanitizeString(testCase.input, 10000),
  expectedOutput: sanitizeString(testCase.expectedOutput, 10000),
  isHidden: Boolean(testCase.isHidden),
}));

router.use(protect);

router.get('/topic/:topicId', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.topicId)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const topic = await Topic.findById(req.params.topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const challenges = await Challenge.find({ topicId: topic._id }).sort({ createdAt: 1 });
    res.json({ challenges: challenges.map(publicChallenge) });
  } catch (error) {
    next(error);
  }
});

router.post('/:challengeId/submit', challengeSubmitRateLimit, async (req, res, next) => {
  try {
    res.status(410).json({
      message: 'Server-side code execution is disabled. Pathora now runs Python challenge tests in the browser with Pyodide.',
    });
  } catch (error) {
    next(error);
  }
});

router.use(authorize('admin'));

router.get('/admin/all', async (_req, res, next) => {
  try {
    const challenges = await Challenge.find({}).sort({ createdAt: -1 }).populate('courseId', 'title').populate('topicId', 'title dayNumber');
    res.json({ challenges });
  } catch (error) {
    next(error);
  }
});

router.post('/admin', async (req, res, next) => {
  try {
    const validationErrors = validateChallengePayload(req.body);

    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    const challenge = await Challenge.create({
      courseId: req.body.courseId,
      topicId: req.body.topicId,
      title: sanitizeString(req.body.title, 160),
      description: sanitizeString(req.body.description, 5000),
      difficulty: req.body.difficulty,
      starterCode: sanitizeString(req.body.starterCode, 50000) || 'print("Hello Pathora")',
      constraints: sanitizeString(req.body.constraints, 3000),
      examples: sanitizeExamples(req.body.examples),
      testCases: sanitizeTestCases(req.body.testCases),
    });

    res.status(201).json({ challenge });
  } catch (error) {
    next(error);
  }
});

router.put('/admin/:challengeId', async (req, res, next) => {
  try {
    const validationErrors = validateChallengePayload(req.body);

    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    const challenge = await Challenge.findById(req.params.challengeId);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    challenge.courseId = req.body.courseId;
    challenge.topicId = req.body.topicId;
    challenge.title = sanitizeString(req.body.title, 160);
    challenge.description = sanitizeString(req.body.description, 5000);
    challenge.difficulty = req.body.difficulty;
    challenge.starterCode = sanitizeString(req.body.starterCode, 50000) || 'print("Hello Pathora")';
    challenge.constraints = sanitizeString(req.body.constraints, 3000);
    challenge.examples = sanitizeExamples(req.body.examples);
    challenge.testCases = sanitizeTestCases(req.body.testCases);
    await challenge.save();

    res.json({ challenge });
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/:challengeId', async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    await challenge.deleteOne();
    res.json({ message: 'Challenge deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
