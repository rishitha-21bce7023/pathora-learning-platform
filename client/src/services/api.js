import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || '/api';

export const getAssetUrl = (path = '') => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (apiUrl.startsWith('/')) {
    return path;
  }

  const apiBase = new URL(apiUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase.origin}${normalizedPath}`;
};

export const isValidPdfUrl = (url = '') => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:';
  } catch (_error) {
    return false;
  }
};

export const getNotePdfUrl = (topic = {}) => {
  const pdfUrl = topic.note?.pdfUrl || topic.notePdfUrl || '';
  return isValidPdfUrl(pdfUrl) ? pdfUrl : '';
};

export const getNoteFileName = (topic = {}) => topic.note?.originalFileName || topic.noteFileName || 'Notes PDF';

const api = axios.create({
  baseURL: apiUrl,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pathora_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getErrorMessage = (error) => {
  if (error?.code === 'ECONNABORTED') {
    return 'The server is taking too long to respond. Please try again in a moment.';
  }

  if (error?.message === 'Network Error') {
    return 'Unable to reach the server. Please wait a moment and try again.';
  }

  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('pathora_token');
      localStorage.removeItem('pathora_user');
    }

    return Promise.reject(error);
  },
);

export default api;
