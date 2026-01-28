import api from './api'

export const authService = {
  login: async (credentials) => {
    return await api.post('/api/v1/auth/login', credentials)
  },

  register: async (userData) => {
    return await api.post('/api/v1/auth/register', userData)
  },

  logout: async () => {
    return await api.post('/api/v1/auth/logout')
  },

  getCurrentUser: async () => {
    return await api.get('/api/v1/auth/me')
  },

  forgotPassword: async (email) => {
    return await api.post('/api/v1/auth/forgot-password', { email })
  },

  resetPassword: async (token, password) => {
    return await api.post('/api/v1/auth/reset-password', { token, password })
  },
}
