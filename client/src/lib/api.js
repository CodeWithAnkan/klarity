import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  // baseURL left empty because Vite dev server proxies /api to backend
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    })
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
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
      // token invalid/expired
      localStorage.removeItem('token')
      // Redirect to login or show login modal
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message)
      return Promise.reject({
        message: 'Network Error: Please check your internet connection',
        isNetworkError: true
      })
    }
    
    return Promise.reject(error)
  }
)

export default api
