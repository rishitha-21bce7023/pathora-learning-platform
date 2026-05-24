import api, { getErrorMessage } from './api.js';

export const fetchChallengesByTopic = async (topicId) => {
  try {
    const response = await api.get(`/challenges/topic/${topicId}`);
    return response.data.challenges || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const submitChallengeSolution = async (challengeId, payload) => {
  try {
    const response = await api.post(`/challenges/${challengeId}/submit`, payload);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const fetchAdminChallenges = async () => {
  try {
    const response = await api.get('/challenges/admin/all');
    return response.data.challenges || [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const createChallenge = async (payload) => {
  try {
    const response = await api.post('/challenges/admin', payload);
    return response.data.challenge;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const updateChallenge = async (challengeId, payload) => {
  try {
    const response = await api.put(`/challenges/admin/${challengeId}`, payload);
    return response.data.challenge;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const deleteChallenge = async (challengeId) => {
  try {
    const response = await api.delete(`/challenges/admin/${challengeId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
