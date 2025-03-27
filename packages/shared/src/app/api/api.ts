import axios from 'axios';
import { API_CONFIG } from './config';
import { store } from '../store/store';

// Create axios instance with config from central config file
const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  headers: API_CONFIG.defaultHeaders,
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    // Get the current access token from Redux store
    const state = store.getState();
    const accessToken = state.tokens?.accessToken;
    
    // If token exists, add it to the Authorization header
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    // Support for development headers like X-User-Name
    // This allows us to impersonate users during development
    if (process.env.NODE_ENV === 'development') {
      const developmentHeaders = {
        'X-User-Name': process.env.REACT_APP_USER_NAME || localStorage.getItem('x-user-name')
      };
      
      // Only add non-empty headers
      Object.entries(developmentHeaders).forEach(([key, value]) => {
        if (value) {
          config.headers[key] = value;
        }
      });
    }
    
    // Log all requests to help with debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Simple response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`API Error:`, error);
    return Promise.reject(error);
  }
);

export default api; 