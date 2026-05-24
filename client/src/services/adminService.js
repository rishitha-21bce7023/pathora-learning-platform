import api, { getErrorMessage } from './api.js';

export const fetchAdminCourses = async () => {
  const response = await api.get('/courses');
  return response.data.courses || [];
};

export const fetchAdminCourseBySlug = async (slug) => {
  const response = await api.get(`/courses/${slug}`);
  return response.data;
};

export const createCourse = async (payload) => {
  const response = await api.post('/courses', payload);
  return response.data.course;
};

export const updateCourse = async (courseId, payload) => {
  const response = await api.put(`/courses/${courseId}`, payload);
  return response.data.course;
};

export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/courses/${courseId}`);
  return response.data;
};

export const createTopic = async (courseId, payload) => {
  const response = await api.post(`/courses/${courseId}/topics`, payload);
  return response.data.topic;
};

export const updateTopic = async (topicId, payload) => {
  const response = await api.put(`/courses/topics/${topicId}`, payload);
  return response.data.topic;
};

export const uploadTopicNotes = async (topicId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/courses/topics/${topicId}/notes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.topic;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data.users || [];
};
