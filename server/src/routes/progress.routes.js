import { Router } from 'express';
import mongoose from 'mongoose';
import ChallengeSubmission from '../models/ChallengeSubmission.js';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import QuizResult from '../models/QuizResult.js';
import Topic from '../models/Topic.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

const ensureCourse = async (slug) => {
  const course = await Course.findOne({ slug: slug.toLowerCase() });

  if (!course) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }

  return course;
};

const getDateKey = (date = new Date()) => {
  const normalized = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return normalized.toISOString().slice(0, 10);
};

const getYesterdayKey = (dateKey) => {
  const parsed = new Date(`${dateKey}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().slice(0, 10);
};

const getTopicsForCourse = async (courseId) => {
  return Topic.find({ courseId, isActive: true }).sort({ order: 1, dayNumber: 1 });
};

const calculateRank = (xp) => {
  if (xp >= 3000) return 'Diamond';
  if (xp >= 2000) return 'Platinum';
  if (xp >= 1000) return 'Gold';
  if (xp >= 400) return 'Silver';
  return 'Bronze';
};

const calculateXp = ({ completedTopics = 0, currentStreak = 0, totalLearningMinutes = 0, averageQuizScore = 0, solvedChallenges = 0 }) => {
  return completedTopics * 100
    + currentStreak * 40
    + Math.round(totalLearningMinutes / 5)
    + Math.round(averageQuizScore * 2)
    + solvedChallenges * 150;
};

const getWeekStart = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const dayOffset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - dayOffset);
  return value;
};

const getDateRangeKeys = (count, endDate = new Date()) => {
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (count - 1 - index));
    return getDateKey(date);
  });
};

const getWeeklyActivity = (activityDates = [], totalLearningMinutes = 0) => {
  const activeSet = new Set(activityDates);
  const activeDateCount = activeSet.size || 1;
  const minutesPerActiveDay = activeSet.size ? Math.max(1, Math.round(totalLearningMinutes / activeDateCount)) : 0;

  return getDateRangeKeys(7).map((dateKey) => {
    const date = new Date(`${dateKey}T00:00:00`);
    return {
      date: dateKey,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      minutes: activeSet.has(dateKey) ? minutesPerActiveDay : 0,
    };
  });
};

const calculateStreakUpdate = (progressDoc, todayKey) => {
  const lastActivityDate = progressDoc.lastActivityDate || '';

  if (lastActivityDate === todayKey) {
    return {
      currentStreak: progressDoc.currentStreak || 0,
      longestStreak: progressDoc.longestStreak || 0,
      lastActivityDate: todayKey,
    };
  }

  const yesterdayKey = getYesterdayKey(todayKey);
  const nextCurrentStreak = lastActivityDate === yesterdayKey ? (progressDoc.currentStreak || 0) + 1 : 1;

  return {
    currentStreak: nextCurrentStreak,
    longestStreak: Math.max(progressDoc.longestStreak || 0, nextCurrentStreak),
    lastActivityDate: todayKey,
  };
};

router.use(protect);

router.get('/summary', async (req, res, next) => {
  try {
    const publishedCourses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).select('title slug');
    const progressDocs = await Progress.find({ userId: req.user._id })
      .populate('courseId', 'title slug')
      .sort({ updatedAt: -1 });
    const progressByCourseId = new Map(progressDocs.map((item) => [item.courseId?._id?.toString(), item]));

    const completeCourseProgress = await Promise.all(
      publishedCourses.map(async (course) => {
        const item = progressByCourseId.get(course._id.toString());
        const topics = await getTopicsForCourse(course._id);
        const totalTopics = topics.length;
        const completedTopics = item?.completedTopics?.length || 0;
        const progressPercent = totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0;

        return {
          courseId: course._id,
          slug: course.slug,
          title: course.title,
          completedTopics,
          totalTopics,
          progressPercent,
          currentStreak: item?.currentStreak || 0,
          longestStreak: item?.longestStreak || 0,
          totalLearningMinutes: item?.totalLearningMinutes || 0,
          lastActivityDate: item?.lastActivityDate || null,
          activityDates: item?.activityDates || [],
        };
      }),
    );

    const overallCompletedTopics = completeCourseProgress.reduce((sum, item) => sum + item.completedTopics, 0);
    const overallTotalTopics = completeCourseProgress.reduce((sum, item) => sum + item.totalTopics, 0);
    const overallProgressPercent = overallTotalTopics
      ? Math.round((overallCompletedTopics / overallTotalTopics) * 100)
      : 0;

    const combinedActivityDates = [...new Set(completeCourseProgress.flatMap((item) => item.activityDates || []))].sort();

    const totalLearningMinutes = completeCourseProgress.reduce((sum, item) => sum + item.totalLearningMinutes, 0);
    const quizResults = await QuizResult.find({ userId: req.user._id }).sort({ createdAt: 1 }).limit(12);
    const quizTrend = quizResults.map((result, index) => ({
      quiz: `Q${index + 1}`,
      score: result.total ? Math.round((result.score / result.total) * 100) : 0,
      createdAt: result.createdAt,
    }));
    const averageQuizScore = quizTrend.length
      ? Math.round(quizTrend.reduce((sum, item) => sum + item.score, 0) / quizTrend.length)
      : 0;
    const solvedChallenges = await ChallengeSubmission.countDocuments({
      userId: req.user._id,
      $expr: { $eq: ['$passedCount', '$totalCount'] },
    });
    const weeklyActivity = getWeeklyActivity(combinedActivityDates, totalLearningMinutes);
    const weekStartKey = getDateKey(getWeekStart());
    const weeklyActiveDays = combinedActivityDates.filter((dateKey) => dateKey >= weekStartKey).length;
    const userXp = calculateXp({
      completedTopics: overallCompletedTopics,
      currentStreak: Math.max(0, ...completeCourseProgress.map((item) => item.currentStreak)),
      totalLearningMinutes,
      averageQuizScore,
      solvedChallenges,
    });

    const allProgressDocs = await Progress.find({}).populate('userId', 'name role');
    const leaderboardByUser = new Map();

    allProgressDocs.forEach((item) => {
      if (!item.userId || item.userId.role !== 'student') {
        return;
      }

      const key = item.userId._id.toString();
      const current = leaderboardByUser.get(key) || {
        name: item.userId.name || 'Pathora Learner',
        completedTopics: 0,
        currentStreak: 0,
        totalLearningMinutes: 0,
      };

      current.completedTopics += item.completedTopics?.length || 0;
      current.currentStreak = Math.max(current.currentStreak, item.currentStreak || 0);
      current.totalLearningMinutes += item.totalLearningMinutes || 0;
      leaderboardByUser.set(key, current);
    });

    const leaderboard = [...leaderboardByUser.values()]
      .map((learner) => {
        const xp = calculateXp(learner);
        return {
          name: learner.name,
          xp,
          rank: calculateRank(xp),
          completedTopics: learner.completedTopics,
        };
      })
      .sort((first, second) => second.xp - first.xp)
      .slice(0, 10);

    res.json({
      overall: {
        currentStreak: Math.max(0, ...completeCourseProgress.map((item) => item.currentStreak)),
        longestStreak: Math.max(0, ...completeCourseProgress.map((item) => item.longestStreak)),
        completedTopics: overallCompletedTopics,
        totalTopics: overallTotalTopics,
        progressPercent: overallProgressPercent,
        totalLearningMinutes,
        activityDates: combinedActivityDates,
        weeklyActiveDays,
        averageQuizScore,
        solvedChallenges,
        xp: userXp,
        rank: calculateRank(userXp),
      },
      courses: completeCourseProgress,
      weeklyActivity,
      quizTrend,
      leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/course/:slug', async (req, res, next) => {
  try {
    const course = await ensureCourse(req.params.slug);
    const topics = await getTopicsForCourse(course._id);
    const progressDoc = await Progress.findOne({
      userId: req.user._id,
      courseId: course._id,
    });

    const progressMap = (progressDoc?.completedTopics || []).reduce((accumulator, topicId) => {
      accumulator[topicId.toString()] = true;
      return accumulator;
    }, {});

    res.json({
      course,
      topics,
      progress: progressMap,
      currentStreak: progressDoc?.currentStreak || 0,
      longestStreak: progressDoc?.longestStreak || 0,
      totalLearningMinutes: progressDoc?.totalLearningMinutes || 0,
      activityDates: progressDoc?.activityDates || [],
    });
  } catch (error) {
    next(error);
  }
});

router.put('/course/:slug/topics/:topicId/complete', async (req, res, next) => {
  try {
    const course = await ensureCourse(req.params.slug);

    if (!mongoose.Types.ObjectId.isValid(req.params.topicId)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const topic = await Topic.findOne({
      _id: req.params.topicId,
      courseId: course._id,
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const todayKey = getDateKey();

    const progressDoc = await Progress.findOneAndUpdate(
      {
        userId: req.user._id,
        courseId: course._id,
      },
      {
        $setOnInsert: {
          userId: req.user._id,
          courseId: course._id,
          completedTopics: [],
          currentStreak: 0,
          longestStreak: 0,
          totalLearningMinutes: 0,
          activityDates: [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const topicIdString = topic._id.toString();
    const alreadyCompleted = progressDoc.completedTopics.some((value) => value.toString() === topicIdString);

    if (alreadyCompleted) {
      const streakUpdate = calculateStreakUpdate(progressDoc, todayKey);
      progressDoc.currentStreak = streakUpdate.currentStreak;
      progressDoc.longestStreak = streakUpdate.longestStreak;
      progressDoc.lastActivityDate = streakUpdate.lastActivityDate;
      if (!progressDoc.activityDates.includes(todayKey)) {
        progressDoc.activityDates.push(todayKey);
      }
      await progressDoc.save();

      return res.json({
        topicId: topicIdString,
        isCompleted: true,
        currentStreak: progressDoc.currentStreak,
        longestStreak: progressDoc.longestStreak,
        totalLearningMinutes: progressDoc.totalLearningMinutes,
      });
    }

    const streakUpdate = calculateStreakUpdate(progressDoc, todayKey);
    progressDoc.completedTopics.push(topic._id);
    progressDoc.totalLearningMinutes += topic.estimatedMinutes || 0;
    progressDoc.currentStreak = streakUpdate.currentStreak;
    progressDoc.longestStreak = streakUpdate.longestStreak;
    progressDoc.lastActivityDate = streakUpdate.lastActivityDate;

    if (!progressDoc.activityDates.includes(todayKey)) {
      progressDoc.activityDates.push(todayKey);
    }

    await progressDoc.save();

    res.json({
      topicId: topicIdString,
      isCompleted: true,
      currentStreak: progressDoc.currentStreak,
      longestStreak: progressDoc.longestStreak,
      totalLearningMinutes: progressDoc.totalLearningMinutes,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/course/:slug/topics/:topicId/uncomplete', async (req, res, next) => {
  try {
    const course = await ensureCourse(req.params.slug);

    if (!mongoose.Types.ObjectId.isValid(req.params.topicId)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const topic = await Topic.findOne({
      _id: req.params.topicId,
      courseId: course._id,
    });

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const progressDoc = await Progress.findOne({
      userId: req.user._id,
      courseId: course._id,
    });

    if (!progressDoc) {
      return res.json({
        topicId: topic._id.toString(),
        isCompleted: false,
        currentStreak: 0,
        longestStreak: 0,
        totalLearningMinutes: 0,
      });
    }

    progressDoc.completedTopics = progressDoc.completedTopics.filter((value) => value.toString() !== topic._id.toString());
    progressDoc.totalLearningMinutes = Math.max(0, progressDoc.totalLearningMinutes - (topic.estimatedMinutes || 0));
    await progressDoc.save();

    res.json({
      topicId: topic._id.toString(),
      isCompleted: false,
      currentStreak: progressDoc.currentStreak,
      longestStreak: progressDoc.longestStreak,
      totalLearningMinutes: progressDoc.totalLearningMinutes,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
