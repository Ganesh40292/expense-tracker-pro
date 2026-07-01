import api from './api';

export const emailService = {
  getPreferences: async () => {
    const response = await api.get('/email-preferences');
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.put('/email-preferences', preferences);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }
};
