const devJwtSecret = 'pathora-dev-secret-please-change';

export const sanitizeString = (value, maxLength = 1000) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
};

export const normalizeEmail = (value) => sanitizeString(value, 254).toLowerCase();

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : devJwtSecret);

  if (!secret || secret.length < 24) {
    const error = new Error('JWT secret is not configured securely');
    error.status = 500;
    throw error;
  }

  return secret;
};

export const isAdminRegistrationAllowed = () => process.env.ALLOW_ADMIN_REGISTRATION === 'true';
