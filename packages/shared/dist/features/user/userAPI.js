const API_ENDPOINT_USER = '/users/me';
const API_ENDPOINT_USERS = '/users';
const API_ENDPOINT_TAGS = '/tags';
/**
 * Get the current user profile
 * @param apiClient The Axios instance to use.
 * @returns Promise with user data
 */
export const fetchCurrentUser = async (apiClient) => {
    try {
        const response = await apiClient.get(API_ENDPOINT_USER);
        console.log("User data fetched successfully:", response.data);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching current user:", error.response?.data || error.message);
        // If the user doesn't exist, we'll get a 404
        if (error.response && error.response.status === 404) {
            throw new Error('User not found - needs onboarding');
        }
        // For network errors or other API failures
        throw new Error(error.response?.data?.message || 'Failed to fetch user - needs onboarding'); // Pass specific message if available
    }
};
/**
 * Create a new user profile during onboarding
 * @param apiClient The Axios instance to use.
 * @param userData The user data to create
 * @returns Promise with the created user data
 */
export const createUser = async (apiClient, userData) => {
    try {
        const response = await apiClient.post(API_ENDPOINT_USERS, userData);
        return response.data;
    }
    catch (error) {
        console.error("Error creating user:", error.response?.data || error.message);
        // Provide a more detailed error message if available
        if (error.response?.data?.message) {
            throw new Error(`Failed to create user: ${error.response.data.message}`);
        }
        // For network errors or other API failures
        throw new Error('Failed to create user profile');
    }
};
/**
 * Fetch all available tags for user profiles
 * @param apiClient The Axios instance to use.
 * @returns Promise with array of tags
 */
export const fetchTags = async (apiClient) => {
    try {
        const response = await apiClient.get(API_ENDPOINT_TAGS);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching tags:", error.response?.data || error.message);
        // Provide a more detailed error message if available
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch tags: ${error.response.data.message}`);
        }
        // For other API failures
        throw new Error('Failed to fetch available tags');
    }
};
