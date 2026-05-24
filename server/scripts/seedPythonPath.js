import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import Challenge from '../src/models/Challenge.js';
import Course from '../src/models/Course.js';
import QuizQuestion from '../src/models/QuizQuestion.js';
import Topic from '../src/models/Topic.js';
import User from '../src/models/User.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@pathora.local';
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || 'PathoraSeed123!';

const createPracticeLinks = (topicTitle) => [
  {
    title: `${topicTitle} practice`,
    url: 'https://www.w3schools.com/python/python_exercises.asp',
    platform: 'W3Schools',
    difficulty: 'beginner',
  },
  {
    title: `${topicTitle} examples`,
    url: 'https://www.programiz.com/python-programming/examples',
    platform: 'Programiz',
    difficulty: 'beginner',
  },
  {
    title: 'Python challenges',
    url: 'https://www.hackerrank.com/domains/python',
    platform: 'HackerRank',
    difficulty: 'mixed',
  },
  {
    title: 'Python problem solving',
    url: 'https://leetcode.com/problemset/',
    platform: 'LeetCode',
    difficulty: 'mixed',
  },
  {
    title: `${topicTitle} questions`,
    url: 'https://www.geeksforgeeks.org/python-exercises-practice-questions-and-solutions/',
    platform: 'GeeksforGeeks',
    difficulty: 'mixed',
  },
];

const createTopic = (dayNumber, title, description, content, estimatedMinutes) => ({
  dayNumber,
  title,
  description,
  content,
  estimatedMinutes,
  practiceLinks: createPracticeLinks(title),
  notePdfUrl: '',
  isActive: true,
});

const topics = [
  createTopic(1, 'Introduction to Python', 'Understand what Python is, why it is popular, and how to set up your environment.', 'Learn the Python basics, installation steps, and the workflow for writing and running Python programs.', 30),
  createTopic(2, 'Variables and Data Types', 'Explore variables, integers, floats, strings, booleans, and type conversions.', 'Practice storing values in variables and converting between common Python data types.', 35),
  createTopic(3, 'Input and Output', 'Learn how to read user input and print formatted output.', 'Build simple interactive programs that accept user input and display useful messages.', 30),
  createTopic(4, 'Operators', 'Understand arithmetic, comparison, logical, and assignment operators.', 'Use operators to build conditions and perform calculations in Python programs.', 35),
  createTopic(5, 'Conditional Statements', 'Learn if, elif, and else statements for decision-making.', 'Write branch-based logic that responds differently depending on conditions.', 40),
  createTopic(6, 'Lists', 'Study Python lists, indexing, slicing, and common list operations.', 'Practice storing and manipulating collections of values with lists.', 40),
  createTopic(7, 'Tuples', 'Learn about immutable tuples and their typical use cases.', 'Use tuples when you need fixed collections of related values.', 30),
  createTopic(8, 'Dictionaries', 'Understand key-value pairs, dictionary methods, and nested data.', 'Store structured data and retrieve values using meaningful keys.', 40),
  createTopic(9, 'Sets', 'Explore set operations such as union, intersection, and difference.', 'Use sets to manage unique values and perform mathematical operations.', 35),
  createTopic(10, 'Strings', 'Learn string methods, formatting, and common text operations.', 'Manipulate text data with Python string functions and formatting.', 40),
  createTopic(11, 'For Loops', 'Master iteration with for loops and sequence traversal.', 'Write loops that process each item in a collection or range.', 35),
  createTopic(12, 'While Loops', 'Understand looping with conditions and when to use while.', 'Create repeatable tasks that continue until a condition is met.', 35),
  createTopic(13, 'Functions', 'Learn how to define reusable functions and return values.', 'Break code into reusable blocks with clear parameters and return values.', 45),
  createTopic(14, 'Lambda Functions', 'Use anonymous functions for concise transformations.', 'Apply lambda expressions in map, filter, and sorting scenarios.', 30),
  createTopic(15, 'File Handling', 'Read and write files in Python.', 'Use file operations to store, load, and process data from disk.', 40),
  createTopic(16, 'Exception Handling', 'Handle errors gracefully with try, except, else, and finally.', 'Build robust programs that recover from invalid input and runtime issues.', 35),
  createTopic(17, 'OOP Basics', 'Learn the foundations of object-oriented programming in Python.', 'Understand classes, objects, attributes, and methods as a programming model.', 45),
  createTopic(18, 'Classes and Objects', 'Create your own classes and instantiate objects.', 'Design simple Python classes that model real-world entities and behavior.', 45),
  createTopic(19, 'Inheritance', 'Use inheritance to reuse and extend class behavior.', 'Build parent-child class relationships for cleaner code.', 35),
  createTopic(20, 'Modules and Packages', 'Learn how to import and organize reusable Python code.', 'Create modular programs using built-in and custom modules.', 40),
  createTopic(21, 'NumPy Basics', 'Get started with arrays and numerical operations.', 'Use NumPy for fast numerical computing and vectorized operations.', 45),
  createTopic(22, 'Pandas Basics', 'Introduce tabular data handling with Series and DataFrames.', 'Load, inspect, and transform datasets using Pandas.', 45),
  createTopic(23, 'Data Visualization', 'Visualize data using Matplotlib and Seaborn concepts.', 'Create charts and graphs that communicate data insights clearly.', 45),
  createTopic(24, 'APIs in Python', 'Learn how to consume APIs with Python requests.', 'Make HTTP requests and parse JSON responses for real-world applications.', 45),
  createTopic(25, 'Flask Basics', 'Build small web applications with Flask.', 'Create simple routes and render responses using Flask.', 45),
  createTopic(26, 'Database Connection', 'Connect Python applications to a database.', 'Use Python libraries to establish and manage database connections.', 45),
  createTopic(27, 'Coding Practice', 'Reinforce learning through practice challenges.', 'Solve guided exercises that reinforce the concepts covered earlier in the course.', 60),
  createTopic(28, 'Mini Project 1', 'Build a small Python project to apply your learning.', 'Develop a beginner-friendly mini project that combines multiple Python topics.', 60),
  createTopic(29, 'Final Project', 'Create a complete Python project from start to finish.', 'Design and implement a final capstone project with a clear outcome.', 75),
  createTopic(30, 'Revision and Assessment', 'Review the full course and assess your knowledge.', 'Complete a revision set and a final assessment to confirm your readiness.', 60),
];

const courseData = {
  title: 'Python Learning Path',
  slug: 'python-learning-path',
  description: 'Learn Python from basics to mini projects with notes, practice, and coding challenges.',
  category: 'Programming',
  level: 'beginner',
  thumbnail: '',
  isPublished: true,
};

const seed = async () => {
  await connectDB();

  try {
    let admin = await User.findOne({ email: seedAdminEmail });

    if (!admin) {
      admin = await User.create({
        name: 'Pathora Seed Admin',
        email: seedAdminEmail,
        password: seedAdminPassword,
        role: 'admin',
      });
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
    }

    let course = await Course.findOne({ slug: courseData.slug });

    if (!course) {
      course = await Course.create({
        ...courseData,
        createdBy: admin._id,
      });
    } else {
      course.set({
        ...courseData,
        createdBy: course.createdBy || admin._id,
      });
      await course.save();
    }

    await Topic.deleteMany({ courseId: course._id });

    const topicDocuments = topics.map((topic, index) => ({
      ...topic,
      courseId: course._id,
      order: index + 1,
    }));

    await Topic.insertMany(topicDocuments);
    const seededTopics = await Topic.find({ courseId: course._id }).sort({ order: 1 });
    const firstTopic = seededTopics[0];

    if (firstTopic) {
      await Challenge.deleteMany({ courseId: course._id });
      await QuizQuestion.deleteMany({ topicId: { $in: seededTopics.map((topic) => topic._id) } });
      await QuizQuestion.insertMany([
        {
          topicId: firstTopic._id,
          question: 'Which function prints text in Python?',
          options: ['echo()', 'print()', 'console.log()', 'printf()'],
          correctAnswer: 'print()',
          explanation: 'Python uses the built-in print function to write values to standard output.',
          difficulty: 'beginner',
        },
        {
          topicId: firstTopic._id,
          question: 'What file extension is commonly used for Python source files?',
          options: ['.py', '.js', '.java', '.html'],
          correctAnswer: '.py',
          explanation: 'Python source files commonly use the .py extension.',
          difficulty: 'beginner',
        },
      ]);
      await Challenge.create({
        courseId: course._id,
        topicId: firstTopic._id,
        title: 'Print a Welcome Message',
        description: 'Write a Python program that prints exactly Hello Pathora.',
        difficulty: 'beginner',
        starterCode: 'print("Hello Pathora")',
        constraints: 'Your program should write the exact expected text to stdout.',
        examples: [
          {
            input: '',
            output: 'Hello Pathora',
            explanation: 'The program prints the required welcome message.',
          },
        ],
        testCases: [
          {
            input: '',
            expectedOutput: 'Hello Pathora',
            isHidden: false,
          },
          {
            input: '',
            expectedOutput: 'Hello Pathora',
            isHidden: true,
          },
        ],
      });
    }

    console.log(`Seeded course: ${course.title} (${course.slug})`);
    console.log(`Inserted topics: ${topicDocuments.length}`);
  } catch (error) {
    console.error('Failed to seed Python Learning Path:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();
