import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import { getJwtSecret, isAdminRegistrationAllowed, isValidEmail, normalizeEmail, sanitizeString } from '../utils/security.js';

const router = Router();

const signToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
};

router.post('/register', async (req, res, next) => {
  try {
    const name = sanitizeString(req.body.name, 80);
    const email = normalizeEmail(req.body.email);
    const { password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' && isAdminRegistrationAllowed() ? 'admin' : 'student',
    });

    res.status(201).json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      token: signToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, authorize('admin', 'student'), (req, res) => {
  res.json({ user: req.user });
});

export default router;
