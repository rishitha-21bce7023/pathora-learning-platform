import api, { getErrorMessage } from './api.js';

export const DEFAULT_COURSE_SLUG = 'python-learning-path';

export const fetchPublishedCourses = async () => {
  try {
    const response = await api.get('/courses/published');
    return response.data.courses || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchCourseRoadmapBySlug = async (slug) => {
  try {
    const response = await api.get(`/courses/slug/${slug}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchCourseProgress = async (slug) => {
  try {
    const response = await api.get(`/progress/course/${slug}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchDashboardProgressSummary = async () => {
  try {
    const response = await api.get('/progress/summary');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const saveTopicProgress = async (slug, topicId) => {
  try {
    const response = await api.put(`/progress/course/${slug}/topics/${topicId}/complete`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const unmarkTopicProgress = async (slug, topicId) => {
  try {
    const response = await api.put(`/progress/course/${slug}/topics/${topicId}/uncomplete`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
