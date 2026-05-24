import { Router } from 'express';
import mongoose from 'mongoose';
import { authorize, protect } from '../middleware/auth.middleware.js';
import QuizQuestion from '../models/QuizQuestion.js';
import QuizResult from '../models/QuizResult.js';
import Topic from '../models/Topic.js';

const router = Router();

const questionResponse = (question, includeAnswer = false) => {
  const item = question.toObject();

  if (!includeAnswer) {
    delete item.correctAnswer;
    delete item.explanation;
  }

  return item;
};

const validateQuestionPayload = (payload) => {
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(payload.topicId)) {
    errors.push('topicId must be a valid topic id');
  }

  if (!payload.question || typeof payload.question !== 'string' || payload.question.trim().length < 5) {
    errors.push('question must be at least 5 characters');
  }

  if (!Array.isArray(payload.options) || payload.options.filter(Boolean).length < 2) {
    errors.push('options must include at least two values');
  }

  if (!payload.correctAnswer || typeof payload.correctAnswer !== 'string') {
    errors.push('correctAnswer is required');
  } else if (Array.isArray(payload.options) && !payload.options.includes(payload.correctAnswer)) {
    errors.push('correctAnswer must match one option');
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(payload.difficulty)) {
    errors.push('difficulty must be beginner, intermediate, or advanced');
  }

  return errors;
};

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

    const questions = await QuizQuestion.find({ topicId: topic._id }).sort({ createdAt: 1 });

    res.json({
      topic,
      questions: questions.map((question) => questionResponse(question, false)),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/topic/:topicId/submit', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.topicId)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const questions = await QuizQuestion.find({ topicId: req.params.topicId }).sort({ createdAt: 1 });
    const answers = req.body.answers || {};
    const reviewedQuestions = questions.map((question) => {
      const selectedAnswer = answers[question._id.toString()] || '';

      return {
        ...questionResponse(question, true),
        selectedAnswer,
        isCorrect: selectedAnswer === question.correctAnswer,
      };
    });
    const score = reviewedQuestions.filter((question) => question.isCorrect).length;

    const result = await QuizResult.create({
      userId: req.user._id,
      topicId: req.params.topicId,
      score,
      total: questions.length,
      answers: reviewedQuestions.map((question) => ({
        questionId: question._id,
        selectedAnswer: question.selectedAnswer,
        isCorrect: question.isCorrect,
      })),
    });

    res.json({
      resultId: result._id,
      score,
      total: questions.length,
      percentage: questions.length ? Math.round((score / questions.length) * 100) : 0,
      questions: reviewedQuestions,
    });
  } catch (error) {
    next(error);
  }
});

router.use(authorize('admin'));

router.get('/admin/questions', async (_req, res, next) => {
  try {
    const questions = await QuizQuestion.find({}).sort({ createdAt: -1 }).populate('topicId', 'title dayNumber');
    res.json({ questions: questions.map((question) => questionResponse(question, true)) });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/questions', async (req, res, next) => {
  try {
    const validationErrors = validateQuestionPayload(req.body);

    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    const question = await QuizQuestion.create({
      topicId: req.body.topicId,
      question: req.body.question.trim(),
      options: req.body.options.map((option) => option.trim()).filter(Boolean),
      correctAnswer: req.body.correctAnswer.trim(),
      explanation: req.body.explanation?.trim() || '',
      difficulty: req.body.difficulty,
    });

    res.status(201).json({ question: questionResponse(question, true) });
  } catch (error) {
    next(error);
  }
});

router.put('/admin/questions/:questionId', async (req, res, next) => {
  try {
    const validationErrors = validateQuestionPayload(req.body);

    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    const question = await QuizQuestion.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({ message: 'Quiz question not found' });
    }

    question.topicId = req.body.topicId;
    question.question = req.body.question.trim();
    question.options = req.body.options.map((option) => option.trim()).filter(Boolean);
    question.correctAnswer = req.body.correctAnswer.trim();
    question.explanation = req.body.explanation?.trim() || '';
    question.difficulty = req.body.difficulty;
    await question.save();

    res.json({ question: questionResponse(question, true) });
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/questions/:questionId', async (req, res, next) => {
  try {
    const question = await QuizQuestion.findById(req.params.questionId);

    if (!question) {
      return res.status(404).json({ message: 'Quiz question not found' });
    }

    await question.deleteOne();
    res.json({ message: 'Quiz question deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
