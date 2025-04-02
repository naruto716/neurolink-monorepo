import { AxiosInstance, AxiosRequestConfig } from 'axios'; // Import AxiosInstance type and AxiosRequestConfig
import { User, Tag, PaginatedUsersResponse, UserProfileInput } from './types'; // Added PaginatedUsersResponse and UserProfileInput

const API_ENDPOINT_USER = '/users/me';
const API_ENDPOINT_USERS = '/users'; // Base endpoint for users
const API_ENDPOINT_TAGS = '/tags'; // Corrected endpoint path (base URL handles /api/v1)

/**
 * Get the current user profile
 * @param apiClient The Axios instance to use.
 * @returns Promise with user data
 */
export const fetchCurrentUser = async (apiClient: AxiosInstance): Promise<User> => {
    try {
        const response = await apiClient.get<User>(API_ENDPOINT_USER);
        console.log("User data fetched successfully:", response.data);
        return response.data;
    } catch (error: any) {
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
export const createUser = async (apiClient: AxiosInstance, userData: UserProfileInput): Promise<User> => {
    try {
        // Ensure UserProfileInput is compatible with CreateUserDto if they differ significantly
        const response = await apiClient.post<User>(API_ENDPOINT_USERS, userData); 
        return response.data;
    } catch (error: any) {
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
 * Fetch available tags, optionally filtered and paginated.
 * @param apiClient The Axios instance to use.
 * @param params Optional parameters for filtering and pagination (type, value, page, limit).
 * @returns Promise with array of tags.
 */
export interface FetchTagsParams {
    type?: string;
    value?: string; // Keep value for potential exact match filtering if needed later
    q?: string; // Add query parameter for search
    page?: number;
    limit?: number;
}

export const fetchTags = async (apiClient: AxiosInstance, params: FetchTagsParams = {}): Promise<Tag[]> => {
    try {
        // Construct query parameters, applying defaults
        const queryParams: Record<string, string | number> = {};
        if (params.type !== undefined) queryParams.type = params.type;
        if (params.value !== undefined) queryParams.value = params.value; // Keep value param
        if (params.q !== undefined) queryParams.q = params.q; // Add q param
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10

        const config: AxiosRequestConfig = { params: queryParams };

        // Use the updated endpoint and pass the config
        const response = await apiClient.get<Tag[]>(API_ENDPOINT_TAGS, config);
        console.log(`Tags fetched successfully with params:`, params);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching tags:", error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch tags: ${error.response.data.message}`);
        }
        throw new Error('Failed to fetch available tags');
    }
};

// Define and export parameters for fetching users based on OpenAPI spec
export interface FetchUsersParams {
    q?: string;
    minAge?: number;
    maxAge?: number;
    tagTypes?: string[];
    tagValues?: string[];
    page?: number;
    limit?: number;
}

/**
 * Fetch a list of users with pagination and filtering (GET /users)
 * @param apiClient The Axios instance to use.
 * @param params Query parameters for filtering and pagination
 * @returns Promise with paginated user data
 */
export const fetchUsers = async (apiClient: AxiosInstance, params: FetchUsersParams = {}): Promise<PaginatedUsersResponse> => {
    try {
        // Construct query parameters, filtering out undefined values
        const queryParams: Record<string, string | number | string[]> = {};
        if (params.q !== undefined) queryParams.q = params.q;
        if (params.minAge !== undefined) queryParams.minAge = params.minAge;
        if (params.maxAge !== undefined) queryParams.maxAge = params.maxAge;
        if (params.tagTypes !== undefined) queryParams.tagTypes = params.tagTypes;
        if (params.tagValues !== undefined) queryParams.tagValues = params.tagValues;
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10

        const config: AxiosRequestConfig = {
            params: queryParams,
            // Axios typically handles array serialization correctly for query params
            // If backend expects specific format (e.g., comma-separated), adjust here or use paramsSerializer
        };

        const response = await apiClient.get<PaginatedUsersResponse>(API_ENDPOINT_USERS, config); 
        console.log("Users fetched successfully:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching users:", error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch users: ${error.response.data.message}`);
        }
        throw new Error('Failed to fetch users');
    }
};
