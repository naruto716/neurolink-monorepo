import * as qs from 'qs'; // Import qs library
const API_ENDPOINT_USER = '/users/me';
const API_ENDPOINT_USERS = '/users'; // Base endpoint for users
const API_ENDPOINT_TAGS = '/tags'; // Corrected endpoint path (base URL handles /api/v1)
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
 * Fetch a user profile by username
 * @param apiClient The Axios instance to use.
 * @param username The username of the user to fetch.
 * @returns Promise with user data
 */
export const fetchUserByUsername = async (apiClient, username) => {
    try {
        const response = await apiClient.get(`${API_ENDPOINT_USERS}/${username}`); // Uses the base /users endpoint
        console.log(`User data fetched successfully for username: ${username}`, response.data);
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching user by username ${username}:`, error.response?.data || error.message);
        // Handle 404 specifically
        if (error.response && error.response.status === 404) {
            throw new Error(`User not found: ${username}`);
        }
        // For network errors or other API failures
        throw new Error(error.response?.data?.message || `Failed to fetch user: ${username}`);
    }
};
export const fetchTags = async (apiClient, params = {}) => {
    try {
        // Construct query parameters, applying defaults
        const queryParams = {};
        if (params.type !== undefined)
            queryParams.type = params.type;
        if (params.value !== undefined)
            queryParams.value = params.value; // Use value for search
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10
        queryParams.fuzzyThreshold = params.fuzzyThreshold || 70; // Default fuzzy threshold 70
        const config = { params: queryParams };
        // Use the updated endpoint and pass the config
        const response = await apiClient.get(API_ENDPOINT_TAGS, config);
        console.log(`Tags fetched successfully with params:`, params);
        return response.data;
    }
    catch (error) {
        console.error("Error fetching tags:", error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch tags: ${error.response.data.message}`);
        }
        throw new Error('Failed to fetch available tags');
    }
};
/**
 * Upload a profile picture for the current user
 * @param apiClient The Axios instance to use.
 * @param file The image file to upload.
 * @returns Promise with the URL of the uploaded picture.
 */
const API_ENDPOINT_PROFILE_PICTURE = '/users/me/profile-picture';
export const uploadProfilePicture = async (apiClient, file) => {
    const formData = new FormData();
    formData.append('file', file); // The API expects the file under the key 'file'
    try {
        const response = await apiClient.post(API_ENDPOINT_PROFILE_PICTURE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log("Profile picture uploaded successfully:", response.data.url);
        return response.data.url;
    }
    catch (error) {
        console.error("Error uploading profile picture:", error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to upload profile picture: ${error.response.data.message}`);
        }
        throw new Error('Failed to upload profile picture');
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
        // Keep tagTypes and tagValues as arrays in the queryParams object
        if (params.tagTypes !== undefined && params.tagTypes.length > 0)
            queryParams.tagTypes = params.tagTypes;
        if (params.tagValues !== undefined && params.tagValues.length > 0)
            queryParams.tagValues = params.tagValues;
        // Removed incorrect 'tags' parameter handling
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10
        const config = {
            params: queryParams,
            // Use qs to serialize arrays with repeated keys
            paramsSerializer: params => {
                return qs.stringify(params, { arrayFormat: 'repeat' });
            }
        };
        const response = await apiClient.get(API_ENDPOINT_USERS, config);
        console.log("Users fetched successfully with params:", queryParams, "Response:", response.data);
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
