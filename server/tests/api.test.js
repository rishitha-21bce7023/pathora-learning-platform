import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'pathora-test-secret-that-is-long-enough';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.COMPILER_RATE_LIMIT_MAX = '100';
process.env.CHALLENGE_RATE_LIMIT_MAX = '100';

let app;
let server;
let baseUrl;
let mongo;
let User;

const request = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  return { status: response.status, body: payload };
};

const login = async (email, password = 'Password123') => {
  const response = await request('POST', '/api/auth/login', {
    body: { email, password },
  });

  assert.equal(response.status, 200);
  return response.body.token;
};

before(async () => {
  mongo = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
    },
  });
  await mongoose.connect(mongo.getUri());
  ({ default: app } = await import('../src/app.js'));
  ({ default: User } = await import('../src/models/User.js'));

  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }

  if (mongo) {
    await mongo.stop();
  }

  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('auth APIs', () => {
  it('registers, logs in, and returns the current user', async () => {
    const register = await request('POST', '/api/auth/register', {
      body: {
        name: 'Student User',
        email: 'student@example.com',
        password: 'Password123',
        role: 'admin',
      },
    });

    assert.equal(register.status, 201);
    assert.equal(register.body.user.role, 'student');

    const token = await login('student@example.com');
    const me = await request('GET', '/api/auth/me', { token });

    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, 'student@example.com');
  });
});

describe('course APIs', () => {
  it('protects admin course APIs and lets admins create courses and topics', async () => {
    const studentToken = await login('student@example.com');
    const forbidden = await request('POST', '/api/courses', {
      token: studentToken,
      body: {
        title: 'Python Basics',
        slug: 'python-basics',
        description: 'Learn Python from the beginning.',
        category: 'Python',
        level: 'beginner',
        isPublished: true,
      },
    });

    assert.equal(forbidden.status, 403);

    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Password123',
      role: 'admin',
    });
    const adminToken = await login('admin@example.com');
    const created = await request('POST', '/api/courses', {
      token: adminToken,
      body: {
        title: 'Python Basics',
        slug: 'python-basics',
        description: 'Learn Python from the beginning.',
        category: 'Python',
        level: 'beginner',
        isPublished: true,
      },
    });

    assert.equal(created.status, 201);
    assert.equal(created.body.course.slug, 'python-basics');

    const topic = await request('POST', `/api/courses/${created.body.course._id}/topics`, {
      token: adminToken,
      body: {
        dayNumber: 1,
        title: 'Variables',
        description: 'Practice Python variables.',
        content: 'Variables store values in Python programs.',
        estimatedMinutes: 15,
        order: 1,
        practiceLinks: [{
          title: 'Python Variables',
          url: 'https://www.w3schools.com/python/python_variables.asp',
          platform: 'W3Schools',
          difficulty: 'beginner',
        }],
      },
    });

    assert.equal(topic.status, 201);
    assert.equal(topic.body.topic.title, 'Variables');
  });
});

describe('progress APIs', () => {
  it('marks a topic complete and returns progress summary', async () => {
    const studentToken = await login('student@example.com');
    const course = await request('GET', '/api/courses/published', { token: studentToken });
    const details = await request('GET', '/api/courses/slug/python-basics', { token: studentToken });
    const topicId = details.body.topics[0]._id;

    assert.equal(course.status, 200);

    const complete = await request('PUT', `/api/progress/course/python-basics/topics/${topicId}/complete`, {
      token: studentToken,
    });

    assert.equal(complete.status, 200);
    assert.equal(complete.body.isCompleted, true);

    const summary = await request('GET', '/api/progress/summary', { token: studentToken });
    assert.equal(summary.status, 200);
    assert.equal(summary.body.overall.completedTopics, 1);
  });
});

describe('compiler API', () => {
  it('does not expose a server-side compiler route', async () => {
    const studentToken = await login('student@example.com');
    const response = await request('POST', '/api/compiler/run', {
      token: studentToken,
      body: {
        language: 'python',
        sourceCode: 'print("Hello Pathora")',
        stdin: '',
      },
    });

    assert.equal(response.status, 404);
  });
});
