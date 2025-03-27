import axios from 'axios';
import { API_CONFIG } from './config';
// Create axios instance with config from central config file
const api = axios.create({
    baseURL: API_CONFIG.baseUrl,
    headers: API_CONFIG.defaultHeaders,
});
// Simple request interceptor
api.interceptors.request.use((config) => {
    // Log all requests to help with debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
}, (error) => Promise.reject(error));
// Simple response interceptor
api.interceptors.response.use((response) => {
    console.log(`API Response: ${response.status}`);
    return response;
}, (error) => {
    console.error(`API Error:`, error);
    return Promise.reject(error);
});
export default api;
