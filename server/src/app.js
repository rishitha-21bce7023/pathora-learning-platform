import cors from 'cors';
import express from 'express';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import challengeRoutes from './routes/challenge.routes.js';
import courseRoutes from './routes/course.routes.js';
import healthRoutes from './routes/health.routes.js';
import progressRoutes from './routes/progress.routes.js';
import quizRoutes from './routes/quiz.routes.js';

const app = express();

app.disable('x-powered-by');

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static('uploads', {
  fallthrough: false,
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  const status = Number(err.status || err.statusCode || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;
  const message = safeStatus >= 500
    ? 'Server error'
    : safeStatus === 404
      ? 'Resource not found'
      : err.message || 'Request failed';

  if (process.env.NODE_ENV !== 'test') {
    console.error(err.message || err);
  }

  res.status(safeStatus).json({ message });
});

export default app;
