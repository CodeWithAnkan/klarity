import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  // Use the environment variable for the deployed URL,
  // and fall back to the local proxy for development.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Optional: Keep console logs for debugging deployed app
    console.log('API Request:', {
      url: config.url,
      method: config.method,
    })
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
    })
    return response
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      // Handle invalid/expired token
      localStorage.removeItem('token')
      // Redirect to login, but avoid redirect loops
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    }
    
    if (!error.response) {
      console.error('Network Error:', error.message)
      return Promise.reject({
        message: 'Network Error: Could not connect to the server.',
        isNetworkError: true
      })
    }
    
    return Promise.reject(error)
  }
)

export default api
