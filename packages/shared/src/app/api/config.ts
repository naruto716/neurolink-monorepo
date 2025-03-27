/**
 * API Configuration
 * 
 * Central place to manage API settings
 */

export const API_CONFIG = {
  // Base URL for all API requests
  baseUrl: 'https://d2agqx8n7tecm4.cloudfront.net',
  
  // API version prefix
  apiVersion: 'v1',
  
  // Endpoints - add new ones as needed
  endpoints: {
    health: '/api/v1/Health',
    posts: '/api/v1/posts',
    users: '/api/v1/Users',
    currentUser: '/api/v1/Users/me'
  },
  
  // Headers to include with all requests
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  }
}; 