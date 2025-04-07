import axios from 'axios';
import { API_CONFIG } from './config';
import { selectAccessToken } from '../../features/tokens/tokensSlice';
/**
 * Creates and configures an Axios instance with interceptors.
 * @param getState - A function that returns the current Redux state (or the relevant part).
 * @returns Configured Axios instance.
 */
export const createApiClient = (getState) => {
    const apiClient = axios.create({
        baseURL: API_CONFIG.baseUrl,
        headers: API_CONFIG.defaultHeaders,
    });
    // Request interceptor to add authentication token OR handle specific chat route
    apiClient.interceptors.request.use((config) => {
        // Check if the request URL starts with /chat for development purposes
        if (config.url?.startsWith('/chat')) {
            console.log(`Handling specific request for chat route: ${config.url}`);
            // Override baseURL for chat requests
            config.baseURL = 'http://localhost:3000/api/v1';
            // Hardcode the X-User-Name header for chat requests
            config.headers['X-User-Name'] = 'simpson1029';
            // Ensure no Authorization header is sent for chat requests
            delete config.headers.Authorization;
        }
        else {
            // Existing logic for other requests: Add Authorization token if available
            try {
                const state = getState();
                const accessToken = selectAccessToken(state);
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                    console.log('Added token to request:', config.url);
                }
                else {
                    console.warn('No token available via getState for request:', config.url);
                }
            }
            catch (error) {
                console.error('Error getting token via getState:', error);
            }
        }
        // Log the final request details (URL might be relative or absolute depending on baseURL override)
        const finalUrl = config.baseURL && !config.url?.startsWith('http') ? `${config.baseURL}${config.url}` : config.url;
        console.log(`API Request: ${config.method?.toUpperCase()} ${finalUrl}`);
        return config;
    }, (error) => Promise.reject(error));
    // Response interceptor (remains the same)
    apiClient.interceptors.response.use((response) => {
        console.log(`API Response: ${response.status}`);
        return response;
    }, (error) => {
        console.error(`API Error:`, error);
        // TODO: Consider adding token refresh logic here if applicable,
        // potentially requiring dispatch to be passed in or handled via callbacks.
        return Promise.reject(error);
    });
    return apiClient;
};
