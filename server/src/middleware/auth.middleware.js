import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../utils/security.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

    if (!decoded?.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};
