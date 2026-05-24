import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Course title must be at least 3 characters'],
      maxlength: [120, 'Course title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Course slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'],
      maxlength: [140, 'Course slug cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [10, 'Course description must be at least 10 characters'],
      maxlength: [3000, 'Course description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Course category is required'],
      trim: true,
      minlength: [2, 'Course category must be at least 2 characters'],
      maxlength: [80, 'Course category cannot exceed 80 characters'],
    },
    level: {
      type: String,
      required: [true, 'Course level is required'],
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    thumbnail: {
      type: String,
      trim: true,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
  },
  {
    timestamps: true,
  },
);

courseSchema.index({ title: 1 });
courseSchema.index({ category: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
