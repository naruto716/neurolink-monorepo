/**
 * API Configuration
 *
 * Central place to manage API settings
 */
export const API_CONFIG = {
    // Base URL for all API requests
    baseUrl: 'http://localhost:3000',
    // API version prefix
    apiVersion: 'v1',
    // Endpoints - add new ones as needed
    endpoints: {
        health: '/api/v1/Health',
        posts: '/api/v1/posts',
    },
    // Headers to include with all requests
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
    }
};
