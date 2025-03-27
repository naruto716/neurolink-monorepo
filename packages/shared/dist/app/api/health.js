import api from './api';
import { API_CONFIG } from './config';
/**
 * Get API health status
 * @returns Promise with health check response
 */
export const checkHealth = async () => {
    try {
        const response = await api.get(API_CONFIG.endpoints.health);
        // If the backend doesn't have a standard format, normalize the response
        if (typeof response.data === 'string') {
            return { status: 'OK', message: response.data };
        }
        // If the backend doesn't include a status field, add it
        if (!response.data.status) {
            return { ...response.data, status: 'OK' };
        }
        return response.data;
    }
    catch (error) {
        console.error('Health check failed:', error);
        // Return a standardized error response
        throw new Error('Health check failed: Unable to connect to API');
    }
};
