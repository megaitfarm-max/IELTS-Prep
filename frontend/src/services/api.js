import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Only redirect to login if we're authenticated but token expired
    // Don't redirect during login attempts
    if (error.response?.status === 401) {
      const isLoginAttempt = error.config?.url?.includes('/auth/login')
      if (!isLoginAttempt) {
        localStorage.removeItem('token')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    
    // Return error details for proper error handling
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message
    return Promise.reject(new Error(errorMessage))
  }
)

export default api
