// API configuration utility
// Handles both development (with Vite proxy) and production (direct backend URL)

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Get the API endpoint URL
 * In development: returns relative path (uses Vite proxy)
 * In production: returns full URL from environment variable
 */
export const getApiUrl = (endpoint) => {
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  // If API_BASE_URL is set (production), use it
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanEndpoint}`
  }
  
  // Otherwise use relative path (development with proxy)
  return cleanEndpoint
}

/**
 * Make an authenticated API request
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')
  const url = getApiUrl(endpoint)
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  }
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }
  
  const response = await fetch(url, config)
  return response
}

export default { getApiUrl, apiRequest }
