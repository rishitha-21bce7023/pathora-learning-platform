import api, { getErrorMessage } from './api.js';

export const fetchQuizForTopic = async (topicId) => {
  try {
    const response = await api.get(`/quizzes/topic/${topicId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const submitQuizAnswers = async (topicId, answers) => {
  try {
    const response = await api.post(`/quizzes/topic/${topicId}/submit`, { answers });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchAdminQuizQuestions = async () => {
  try {
    const response = await api.get('/quizzes/admin/questions');
    return response.data.questions || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createQuizQuestion = async (payload) => {
  try {
    const response = await api.post('/quizzes/admin/questions', payload);
    return response.data.question;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateQuizQuestion = async (questionId, payload) => {
  try {
    const response = await api.put(`/quizzes/admin/questions/${questionId}`, payload);
    return response.data.question;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteQuizQuestion = async (questionId) => {
  try {
    const response = await api.delete(`/quizzes/admin/questions/${questionId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
