import { AxiosInstance } from 'axios'; // Import AxiosInstance
import { createApiClient } from '@neurolink/shared';
import { store } from '../store/initStore'; // Import the web app's store

// Create the single, configured Axios instance by passing the store's getState method
const apiClient: AxiosInstance = createApiClient(store.getState);

// Export the instance for use throughout the web application
export default apiClient; 