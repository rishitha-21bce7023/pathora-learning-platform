import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Challenge from '../models/Challenge.js';
import Course from '../models/Course.js';
import QuizQuestion from '../models/QuizQuestion.js';
import Topic from '../models/Topic.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { sanitizeString } from '../utils/security.js';

const router = Router();

const maxNoteFileSize = 10 * 1024 * 1024;
const cloudinaryNotesFolder = process.env.CLOUDINARY_NOTES_FOLDER || 'pathora/notes';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxNoteFileSize,
  },
  fileFilter(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();

    if (file.mimetype !== 'application/pdf' || extension !== '.pdf') {
      callback(new Error('Only PDF files are allowed'));
      return;
    }

    callback(null, true);
  },
});

const ensureCloudinaryConfigured = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const error = new Error('Cloudinary notes upload is not configured');
    error.status = 400;
    throw error;
  }
};

const uploadPdfToCloudinary = (file, topicId) => {
  ensureCloudinaryConfigured();

  const extension = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, extension).replace(/[^a-zA-Z0-9.-]/g, '-');
  const publicId = `${topicId}-${Date.now()}-${baseName || 'notes'}${extension}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: cloudinaryNotesFolder,
        public_id: publicId,
        resource_type: 'raw',
        type: 'upload',
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    stream.end(file.buffer);
  });
};

const deleteCloudinaryRawFile = async (publicId) => {
  if (!publicId) {
    return;
  }

  try {
    ensureCloudinaryConfigured();
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch (_error) {
    // Deleting metadata should not fail just because Cloudinary cleanup failed.
  }
};

const getTopicNoteUrl = (topic) => topic?.note?.pdfUrl || topic?.notePdfUrl || '';

const getTopicNoteFileName = (topic) => topic?.note?.originalFileName || topic?.noteFileName || '';

const isValidPdfUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'https:';
  } catch (_error) {
    return false;
  }
};

const noteResponse = (topic) => {
  const pdfUrl = getTopicNoteUrl(topic);

  if (!pdfUrl || !isValidPdfUrl(pdfUrl)) {
    return {
      pdfUrl: '',
      publicId: topic?.note?.publicId || '',
      originalFileName: getTopicNoteFileName(topic),
      topicId: topic?._id || topic?.note?.topicId || null,
      uploadedAt: topic?.note?.uploadedAt || null,
    };
  }

  return {
    pdfUrl,
    publicId: topic?.note?.publicId || '',
    originalFileName: getTopicNoteFileName(topic),
    topicId: topic?._id || topic?.note?.topicId || null,
    uploadedAt: topic?.note?.uploadedAt || null,
  };
};

const applyNoteMetadata = (topic, result, originalFileName) => {
  const secureUrl = result.secure_url;

  if (!secureUrl || !isValidPdfUrl(secureUrl)) {
    const error = new Error('Cloudinary did not return a valid secure PDF URL');
    error.status = 502;
    throw error;
  }

  topic.note = {
    pdfUrl: secureUrl,
    publicId: result.public_id,
    originalFileName,
    topicId: topic._id,
    uploadedAt: new Date(),
  };
  topic.notePdfUrl = secureUrl;
  topic.noteFileName = originalFileName;
};

const clearNoteMetadata = (topic) => {
  topic.note = {
    pdfUrl: '',
    publicId: '',
    originalFileName: '',
    topicId: topic._id,
    uploadedAt: null,
  };
  topic.notePdfUrl = '';
  topic.noteFileName = '';
};

const buildSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const allowedPracticeDifficulties = ['beginner', 'intermediate', 'advanced', 'mixed'];

const normalizePracticeLink = (item) => {
  if (typeof item === 'string') {
    const url = sanitizeString(item);

    return {
      title: url,
      url,
      platform: 'External',
      difficulty: 'mixed',
    };
  }

  return {
    title: sanitizeString(item?.title),
    url: sanitizeString(item?.url),
    platform: sanitizeString(item?.platform),
    difficulty: allowedPracticeDifficulties.includes(item?.difficulty) ? item.difficulty : 'beginner',
  };
};

const normalizePracticeLinks = (links) => {
  if (!Array.isArray(links)) {
    return [];
  }

  return links.map(normalizePracticeLink).filter((link) => link.title && link.url && link.platform);
};

const isValidPracticeUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (_error) {
    return false;
  }
};

const validateCoursePayload = (payload) => {
  const errors = [];

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 3) {
    errors.push('title must be a string with at least 3 characters');
  }

  if (payload.slug !== undefined) {
    if (typeof payload.slug !== 'string' || payload.slug.trim().length === 0) {
      errors.push('slug must be a non-empty string');
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug.trim())) {
      errors.push('slug must only contain lowercase letters, numbers, and hyphens');
    }
  }

  if (!payload.description || typeof payload.description !== 'string' || payload.description.trim().length < 10) {
    errors.push('description must be a string with at least 10 characters');
  }

  if (!payload.category || typeof payload.category !== 'string' || payload.category.trim().length < 2) {
    errors.push('category must be a string with at least 2 characters');
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(payload.level)) {
    errors.push('level must be beginner, intermediate, or advanced');
  }

  if (payload.thumbnail !== undefined && typeof payload.thumbnail !== 'string') {
    errors.push('thumbnail must be a string when provided');
  }

  if (payload.isPublished !== undefined && typeof payload.isPublished !== 'boolean') {
    errors.push('isPublished must be a boolean when provided');
  }

  return errors;
};

const validateTopicPayload = (payload) => {
  const errors = [];

  if (!payload.dayNumber || Number.isNaN(Number(payload.dayNumber)) || Number(payload.dayNumber) < 1) {
    errors.push('dayNumber must be a number greater than or equal to 1');
  }

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 3) {
    errors.push('title must be a string with at least 3 characters');
  }

  if (!payload.description || typeof payload.description !== 'string' || payload.description.trim().length < 10) {
    errors.push('description must be a string with at least 10 characters');
  }

  if (!payload.content || typeof payload.content !== 'string' || payload.content.trim().length < 10) {
    errors.push('content must be a string with at least 10 characters');
  }

  if (!payload.estimatedMinutes || Number.isNaN(Number(payload.estimatedMinutes)) || Number(payload.estimatedMinutes) < 1) {
    errors.push('estimatedMinutes must be a number greater than or equal to 1');
  }

  if (payload.order !== undefined && (Number.isNaN(Number(payload.order)) || Number(payload.order) < 1)) {
    errors.push('order must be a number greater than or equal to 1');
  }

  if (payload.practiceLinks !== undefined) {
    if (!Array.isArray(payload.practiceLinks)) {
      errors.push('practiceLinks must be an array');
    } else if (
      payload.practiceLinks.some((item) => {
        const link = normalizePracticeLink(item);
        return !link.title || !link.url || !link.platform || !isValidPracticeUrl(link.url) || !allowedPracticeDifficulties.includes(link.difficulty);
      })
    ) {
      errors.push('each practice link must include title, valid http(s) url, platform, and difficulty');
    }
  }

  if (payload.notePdfUrl) {
    errors.push('notes must be uploaded through the PDF upload endpoint');
  }

  if (payload.noteFileName) {
    errors.push('notes must be uploaded through the PDF upload endpoint');
  }

  if (payload.isActive !== undefined && typeof payload.isActive !== 'boolean') {
    errors.push('isActive must be a boolean when provided');
  }

  return errors;
};

const courseResponse = (course) => ({
  ...course.toObject(),
  createdBy: course.createdBy
    ? {
        id: course.createdBy._id || course.createdBy,
        name: course.createdBy.name || undefined,
        email: course.createdBy.email || undefined,
        role: course.createdBy.role || undefined,
      }
    : undefined,
});

const topicResponse = (topic) => {
  const plainTopic = topic.toObject();
  const note = noteResponse(topic);

  return {
    ...plainTopic,
    note,
    notePdfUrl: note.pdfUrl,
    noteFileName: note.originalFileName,
  };
};

const ensureCourseExists = async (courseId) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }

  const course = await Course.findById(courseId);

  if (!course) {
    const error = new Error('Course not found');
    error.status = 404;
    throw error;
  }

  return course;
};

router.use(protect);

router.get('/published', async (req, res, next) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role');

    res.json({ courses: courses.map(courseResponse) });
  } catch (error) {
    next(error);
  }
});

router.get('/slug/:slug', async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug.toLowerCase(), isPublished: true }).populate('createdBy', 'name email role');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const topics = await Topic.find({ courseId: course._id, isActive: true }).sort({ order: 1, dayNumber: 1 });

    res.json({
      course: courseResponse(course),
      topics: topics.map(topicResponse),
    });
  } catch (error) {
    next(error);
  }
});

router.use(authorize('admin'));

const deleteTopicNoteFile = async (topic) => {
  await deleteCloudinaryRawFile(topic?.note?.publicId);
};

router.post('/topics/:topicId/notes', (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'PDF notes must be 10MB or smaller' });
      }

      return res.status(400).json({ message: error.message });
    }

    next();
  });
}, async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A PDF file is required' });
    }

    const previousPublicId = topic.note?.publicId;
    const uploadResult = await uploadPdfToCloudinary(req.file, topic._id);

    applyNoteMetadata(topic, uploadResult, req.file.originalname);
    await topic.save();

    await deleteCloudinaryRawFile(previousPublicId);

    res.json({ topic: topicResponse(topic) });
  } catch (error) {
    next(error);
  }
});

router.delete('/topics/:topicId/notes', async (req, res, next) => {
  try {
    const topic = await Topic.findById(req.params.topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const previousPublicId = topic.note?.publicId;
    clearNoteMetadata(topic);
    await topic.save();

    await deleteCloudinaryRawFile(previousPublicId);

    res.json({ topic: topicResponse(topic) });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const courses = await Course.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email role');

    res.json({ courses: courses.map(courseResponse) });
  } catch (error) {
    next(error);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug.toLowerCase() }).populate('createdBy', 'name email role');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const topics = await Topic.find({ courseId: course._id }).sort({ order: 1, dayNumber: 1 });

    res.json({
      course: courseResponse(course),
      topics: topics.map(topicResponse),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const validationErrors = validateCoursePayload(req.body);

    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    const slug = sanitizeString(req.body.slug) || buildSlug(req.body.title);
    const existingCourse = await Course.findOne({ slug });

    if (existingCourse) {
      return res.status(409).json({ message: 'A course with this slug already exists' });
    }

    const course = await Course.create({
      title: sanitizeString(req.body.title),
      slug,
      description: sanitizeString(req.body.description),
      category: sanitizeString(req.body.category),
      level: req.body.level,
      thumbnail: sanitizeString(req.body.thumbnail),
      isPublished: req.body.isPublished ?? false,
      createdBy: req.user._id,
    });

    const populatedCourse = await Course.findById(course._id).populate('createdBy', 'name email role');

    res.status(201).json({ course: courseResponse(populatedCourse) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A course with this slug already exists' });
    }

    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const validationErrors = validateCoursePayload(req.body);

    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const nextSlug = sanitizeString(req.body.slug) || buildSlug(req.body.title);

    const existingCourse = await Course.findOne({ slug: nextSlug, _id: { $ne: course._id } });

    if (existingCourse) {
      return res.status(409).json({ message: 'A course with this slug already exists' });
    }

    course.title = sanitizeString(req.body.title);
    course.slug = nextSlug;
    course.description = sanitizeString(req.body.description);
    course.category = sanitizeString(req.body.category);
    course.level = req.body.level;
    course.thumbnail = sanitizeString(req.body.thumbnail);
    course.isPublished = req.body.isPublished ?? course.isPublished;

    await course.save();

    const updatedCourse = await Course.findById(course._id).populate('createdBy', 'name email role');

    res.json({ course: courseResponse(updatedCourse) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A course with this slug already exists' });
    }

    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const topics = await Topic.find({ courseId: course._id });
    const topicIds = topics.map((topic) => topic._id);
    await Promise.all(topics.map(deleteTopicNoteFile));
    await Challenge.deleteMany({ courseId: course._id });
    await QuizQuestion.deleteMany({ topicId: { $in: topicIds } });
    await Topic.deleteMany({ courseId: course._id });
    await course.deleteOne();

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:courseId/topics', async (req, res, next) => {
  try {
    const validationErrors = validateTopicPayload(req.body);

    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    await ensureCourseExists(req.params.courseId);

    const maxOrderTopic = await Topic.findOne({ courseId: req.params.courseId }).sort({ order: -1 });
    const nextOrder = Number(req.body.order ?? (maxOrderTopic?.order ?? 0) + 1);

    const topic = await Topic.create({
      courseId: req.params.courseId,
      dayNumber: Number(req.body.dayNumber),
      title: sanitizeString(req.body.title),
      description: sanitizeString(req.body.description),
      content: sanitizeString(req.body.content),
      estimatedMinutes: Number(req.body.estimatedMinutes),
      order: nextOrder,
      practiceLinks: normalizePracticeLinks(req.body.practiceLinks),
      isActive: req.body.isActive ?? true,
    });

    res.status(201).json({ topic: topicResponse(topic) });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }

    next(error);
  }
});

router.put('/topics/:topicId', async (req, res, next) => {
  try {
    const validationErrors = validateTopicPayload(req.body);

    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.topicId)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const topic = await Topic.findById(req.params.topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    await ensureCourseExists(topic.courseId);

    topic.dayNumber = Number(req.body.dayNumber);
    topic.title = sanitizeString(req.body.title);
    topic.description = sanitizeString(req.body.description);
    topic.content = sanitizeString(req.body.content);
    topic.estimatedMinutes = Number(req.body.estimatedMinutes);
    topic.order = req.body.order !== undefined ? Number(req.body.order) : topic.order;
    topic.practiceLinks = req.body.practiceLinks !== undefined ? normalizePracticeLinks(req.body.practiceLinks) : topic.practiceLinks;
    topic.isActive = req.body.isActive ?? topic.isActive;

    await topic.save();

    res.json({ topic: topicResponse(topic) });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }

    next(error);
  }
});

router.delete('/topics/:topicId', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.topicId)) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const topic = await Topic.findById(req.params.topicId);

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    await ensureCourseExists(topic.courseId);
    await deleteTopicNoteFile(topic);
    await topic.deleteOne();

    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message });
    }

    next(error);
  }
});

export default router;
