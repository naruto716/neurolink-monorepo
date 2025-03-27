import api from '../../app/api/api';
import { API_CONFIG } from '../../app/api/config';
/**
 * Get the current user profile
 * @returns Promise with user data
 */
export const fetchCurrentUser = async () => {
    try {
        const response = await api.get(API_CONFIG.endpoints.currentUser);
        return response.data;
    }
    catch (error) {
        // If the user doesn't exist, we'll get a 404
        if (error.response && error.response.status === 404) {
            throw new Error('User not found - needs onboarding');
        }
        // For network errors or other API failures
        throw new Error('Failed to fetch user - needs onboarding');
    }
};
