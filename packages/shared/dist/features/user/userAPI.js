const API_ENDPOINT_USER = '/users/me';
const API_ENDPOINT_USERS = '/users'; // Base endpoint for users
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
 * @param userData The user data to create (using UserProfileInput type)
 * @returns Promise with the created user data
 */
export const createUser = async (apiClient, userData) => {
    try {
        // Ensure UserProfileInput is compatible with CreateUserDto if they differ significantly
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
/**
 * Fetch a list of users with pagination and filtering (GET /users)
 * @param apiClient The Axios instance to use.
 * @param params Query parameters for filtering and pagination
 * @returns Promise with paginated user data
 */
export const fetchUsers = async (apiClient, params = {}) => {
    try {
        // Construct query parameters, filtering out undefined values
        const queryParams = {};
        if (params.q !== undefined)
            queryParams.q = params.q;
        if (params.minAge !== undefined)
            queryParams.minAge = params.minAge;
        if (params.maxAge !== undefined)
            queryParams.maxAge = params.maxAge;
        if (params.tagTypes !== undefined)
            queryParams.tagTypes = params.tagTypes;
        if (params.tagValues !== undefined)
            queryParams.tagValues = params.tagValues;
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10
        const config = {
            params: queryParams,
            // Axios typically handles array serialization correctly for query params
            // If backend expects specific format (e.g., comma-separated), adjust here or use paramsSerializer
        };
        const response = await apiClient.get(API_ENDPOINT_USERS, config);
        console.log("Users fetched successfully:", response.data);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching users:", error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch users: ${error.response.data.message}`);
        }
        throw new Error('Failed to fetch users');
    }
};
