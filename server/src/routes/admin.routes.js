import { Router } from 'express';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import User from '../models/User.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({ role: 'student' }).sort({ createdAt: -1 }).select('-password');
    const progressDocs = await Progress.find({ userId: { $in: users.map((user) => user._id) } })
      .populate('courseId', 'title slug')
      .sort({ updatedAt: -1 });

    const progressByUser = new Map();

    for (const progress of progressDocs) {
      const key = progress.userId.toString();
      const existing = progressByUser.get(key) || [];
      existing.push(progress);
      progressByUser.set(key, existing);
    }

    const courses = await Course.find({ isPublished: true }).select('title slug');

    const payload = users.map((user) => {
      const records = progressByUser.get(user._id.toString()) || [];
      const latestRecord = records[0];

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt || null,
        activeCourses: records.length,
        totalLearningMinutes: records.reduce((sum, record) => sum + (record.totalLearningMinutes || 0), 0),
        currentStreak: records.reduce((sum, record) => sum + (record.currentStreak || 0), 0),
        completedTopics: records.reduce((sum, record) => sum + (record.completedTopics?.length || 0), 0),
        currentCourse: latestRecord?.courseId
          ? {
              id: latestRecord.courseId._id,
              title: latestRecord.courseId.title,
              slug: latestRecord.courseId.slug,
            }
          : null,
        courseCount: courses.length,
      };
    });

    res.json({ users: payload });
  } catch (error) {
    next(error);
  }
});

export default router;
