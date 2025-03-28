/**
 * API Configuration
 *
 * Central place to manage API settings
 */
export const API_CONFIG = {
    // Base URL for all API requests, including the API version path
    baseUrl: 'https://d2agqx8n7tecm4.cloudfront.net/api/v1',
    // Endpoints - relative to the baseUrl
    endpoints: {
        posts: '/posts',
        users: '/users',
        currentUser: '/users/me',
        tags: '/tags'
    },
    // Headers to include with all requests
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
    }
};
