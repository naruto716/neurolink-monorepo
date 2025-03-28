import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from './config';
import { selectAccessToken } from '../../features/tokens/tokensSlice';
import { SharedRootState } from '../store/store';

// Define the type for the getState function expected by createApiClient
type GetStateFn = () => SharedRootState; // Or potentially 'any' or 'unknown' if state shape varies wildly

/**
 * Creates and configures an Axios instance with interceptors.
 * @param getState - A function that returns the current Redux state (or the relevant part).
 * @returns Configured Axios instance.
 */
export const createApiClient = (getState: GetStateFn): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: API_CONFIG.baseUrl,
    headers: API_CONFIG.defaultHeaders,
  });

  // Request interceptor to add authentication token
  apiClient.interceptors.request.use(
    (config) => {
      try {
        // Get the current state using the provided getState function
        const state = getState();
        // Use the specific selector to get the token from the state
        const accessToken = selectAccessToken(state);

        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
          console.log('Added token to request:', config.url);
        } else {
          // Fallback or warning (consider if localStorage fallback is still needed/desired)
          console.warn('No token available via getState for request:', config.url);
          // Optional: Remove localStorage fallback if Redux is the single source of truth
          // const fallbackToken = localStorage.getItem('auth_access_token');
          // if (fallbackToken) { ... }
        }
      } catch (error) {
        console.error('Error getting token via getState:', error);
      }

      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor (remains the same)
  apiClient.interceptors.response.use(
    (response) => {
      console.log(`API Response: ${response.status}`);
      return response;
    },
    (error) => {
      console.error(`API Error:`, error);
      // TODO: Consider adding token refresh logic here if applicable,
      // potentially requiring dispatch to be passed in or handled via callbacks.
      return Promise.reject(error);
    }
  );

  return apiClient;
}; 