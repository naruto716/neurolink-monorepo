import { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as qs from 'qs'; // Import qs library
import { User, Tag, PaginatedUsersResponse, UserProfileInput, PaginatedConnectionsResponse, Connection } from './types';

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
 * Fetch a user profile by username
 * @param apiClient The Axios instance to use.
 * @param username The username of the user to fetch.
 * @returns Promise with user data
 */
export const fetchUserByUsername = async (apiClient: AxiosInstance, username: string): Promise<User> => {
    try {
        const response = await apiClient.get<User>(`${API_ENDPOINT_USERS}/${username}`); // Uses the base /users endpoint
        console.log(`User data fetched successfully for username: ${username}`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching user by username ${username}:`, error.response?.data || error.message);
        // Handle 404 specifically
        if (error.response && error.response.status === 404) {
            throw new Error(`User not found: ${username}`);
        }
        // For network errors or other API failures
        throw new Error(error.response?.data?.message || `Failed to fetch user: ${username}`);
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
    value?: string; // Parameter for search query
    page?: number;
    limit?: number;
    fuzzyThreshold?: number; // Parameter for fuzzy search threshold
}

export const fetchTags = async (apiClient: AxiosInstance, params: FetchTagsParams = {}): Promise<Tag[]> => {
    try {
        // Construct query parameters, applying defaults
        const queryParams: Record<string, string | number> = {};
        if (params.type !== undefined) queryParams.type = params.type;
        if (params.value !== undefined) queryParams.value = params.value; // Use value for search
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10
        queryParams.fuzzyThreshold = params.fuzzyThreshold || 70; // Default fuzzy threshold 70

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


/**
 * Upload a profile picture for the current user
 * @param apiClient The Axios instance to use.
 * @param file The image file to upload.
 * @returns Promise with the URL of the uploaded picture.
 */
const API_ENDPOINT_PROFILE_PICTURE = '/users/me/profile-picture';

interface UploadResponse {
  url: string;
}

export const uploadProfilePicture = async (apiClient: AxiosInstance, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file); // The API expects the file under the key 'file'

    try {
        const response = await apiClient.post<UploadResponse>(API_ENDPOINT_PROFILE_PICTURE, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log("Profile picture uploaded successfully:", response.data.url);
        return response.data.url;
    } catch (error: any) {
        console.error("Error uploading profile picture:", error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to upload profile picture: ${error.response.data.message}`);
        }
        throw new Error('Failed to upload profile picture');
    }
};


// Define and export parameters for fetching users based on OpenAPI spec
export interface FetchUsersParams {
    q?: string;
    minAge?: number;
    maxAge?: number;
    tagTypes?: string[];
    tagValues?: string[];
    tags?: Tag[]; // Add tags array for filtering
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
        // Keep tagTypes and tagValues as arrays in the queryParams object
        if (params.tagTypes !== undefined && params.tagTypes.length > 0) queryParams.tagTypes = params.tagTypes;
        if (params.tagValues !== undefined && params.tagValues.length > 0) queryParams.tagValues = params.tagValues;
        // Removed incorrect 'tags' parameter handling
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10

        const config: AxiosRequestConfig = {
            params: queryParams,
            // Use qs to serialize arrays with repeated keys
            paramsSerializer: params => {
                return qs.stringify(params, { arrayFormat: 'repeat' });
            }
        };
        // Make the API call inside the try block
        const response = await apiClient.get<PaginatedUsersResponse>(API_ENDPOINT_USERS, config);
        console.log("Users fetched successfully with params:", queryParams, "Response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching users:", error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch users: ${error.response.data.message}`);
        }
        throw new Error('Failed to fetch users');
    }
}; // End of fetchUsers function


/**
 * Fetch a list of friends for a specific user with pagination
 * GET /users/{username}/friends
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose friends to fetch.
 * @param params Query parameters for pagination (page, limit)
 * @returns Promise with paginated user data (friends)
 */
export const fetchUserFriends = async (
    apiClient: AxiosInstance,
    username: string,
    params: { page?: number; limit?: number } = {}
): Promise<PaginatedUsersResponse> => {
    try {
        const queryParams: Record<string, string | number> = {};
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10

        const config: AxiosRequestConfig = { params: queryParams };

        const response = await apiClient.get<PaginatedUsersResponse>(
            `${API_ENDPOINT_USERS}/${username}/friends`,
            config
        );
        console.log(`Friends fetched successfully for ${username} with params:`, queryParams, "Response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching friends for ${username}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch friends for ${username}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to fetch friends for ${username}`);
    }
};


/**
 * Fetch the friend count for a specific user
 * GET /users/{username}/friends/count
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose friend count to fetch.
 * @returns Promise with the friend count (number)
 */
export const fetchUserFriendCount = async (
    apiClient: AxiosInstance,
    username: string
): Promise<number> => {
    try {
        // The API returns JSON: { count: number }
        const response = await apiClient.get<{ count: number }>(
            `${API_ENDPOINT_USERS}/${username}/friends/count`
        );
        // Removed extra parenthesis
        console.log(`Friend count fetched successfully for ${username}:`, response.data.count);
        return response.data.count; // Return the count property
    } catch (error: any) {
        console.error(`Error fetching friend count for ${username}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch friend count for ${username}: ${error.response.data.message}`);
        }
        // Check if the error is due to parsing failure during transformResponse
        if (error.message === "Invalid friend count format received from API") {
             throw error;
        }
        throw new Error(`Failed to fetch friend count for ${username}`);
    }
};

/**
 * Fetch incoming friend requests for a specific user with pagination
 * GET /users/{username}/connections/received?status=pending
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose pending requests to fetch.
 * @param params Query parameters for pagination (page, limit)
 * @returns Promise with paginated connection data
 */
export const fetchPendingRequests = async (
    apiClient: AxiosInstance,
    username: string,
    params: { page?: number; limit?: number } = {}
): Promise<PaginatedConnectionsResponse> => {
    try {
        const queryParams: Record<string, string | number> = {
            status: 'pending', // Always fetch pending requests
        };
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10

        const config: AxiosRequestConfig = { params: queryParams };

        const response = await apiClient.get<PaginatedConnectionsResponse>(
            `${API_ENDPOINT_USERS}/${username}/connections/received`,
            config
        );
        console.log(`Pending requests fetched successfully for ${username}:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching pending requests for ${username}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch pending requests for ${username}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to fetch pending requests for ${username}`);
    }
};

/**
 * Accept an incoming friend request
 * PATCH /users/me/connections/{initiatorUsername}/accept
 * @param apiClient The Axios instance to use.
 * @param initiatorUsername The username of the user who sent the request.
 * @returns Promise with the updated connection data.
 */
export const acceptFriendRequest = async (
    apiClient: AxiosInstance,
    initiatorUsername: string
): Promise<Connection> => {
    try {
        // Use PATCH instead of POST
        const response = await apiClient.patch<Connection>(
            `/users/me/connections/${initiatorUsername}/accept`
            // No request body is needed for this PATCH based on the docs
        );
        console.log(`Friend request from ${initiatorUsername} accepted successfully:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error accepting friend request from ${initiatorUsername}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to accept friend request from ${initiatorUsername}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to accept friend request from ${initiatorUsername}`);
    }
};

/**
 * Decline or cancel a friend request/connection
 * DELETE /users/me/connections/{otherUsername}
 * @param apiClient The Axios instance to use.
 * @param otherUsername The username of the other user in the connection.
 * @returns Promise<void>
 */
export const declineFriendRequest = async (
    apiClient: AxiosInstance,
    otherUsername: string
): Promise<void> => {
    try {
        await apiClient.delete(
            `/users/me/connections/${otherUsername}`
        );
        console.log(`Connection with ${otherUsername} removed successfully.`);
    } catch (error: any) {
        console.error(`Error declining/cancelling connection with ${otherUsername}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to decline/cancel connection with ${otherUsername}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to decline/cancel connection with ${otherUsername}`);
    }
};

/**
 * Send a friend request to another user.
 * POST /users/me/connections/{friendUsername}
 * @param apiClient The Axios instance to use.
 * @param friendUsername The username of the user to send the request to.
 * @returns Promise with the new connection data (likely status: 'pending').
 */
export const sendFriendRequest = async (
    apiClient: AxiosInstance,
    friendUsername: string
): Promise<Connection> => { // Assuming the response matches the Connection type
    try {
        const response = await apiClient.post<Connection>(
            `/users/me/connections/${friendUsername}`
        );
        console.log(`Friend request sent to ${friendUsername} successfully:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error sending friend request to ${friendUsername}:`, error.response?.data || error.message);
        // Handle specific errors like already friends or request already sent if the API provides them
        if (error.response?.data?.message) {
            throw new Error(`${error.response.data.message}`); // Re-throw specific API message
        }
        throw new Error(`Failed to send friend request to ${friendUsername}`);
    }
};

/**
 * Check the friendship status between the current user and another user.
 * GET /users/me/friends/{otherUsername}/status
 * @param apiClient The Axios instance to use.
 * @param otherUsername The username of the other user to check the status with.
 * @returns Promise<{ isFriend: boolean }>
 */
export const fetchConnectionStatus = async (
    apiClient: AxiosInstance,
    otherUsername: string
): Promise<{ isFriend: boolean }> => {
    try {
        const response = await apiClient.get<{ isFriend: boolean }>(
            `/users/me/friends/${otherUsername}/status`
        );
        console.log(`Connection status checked for ${otherUsername}:`, response.data);
        return response.data;
    } catch (error: any) {
        // Handle 404 as simply "not friends" without throwing an error
        if (error.response && error.response.status === 404) {
            console.log(`Connection status check for ${otherUsername}: Not found (implies not friends).`);
            return { isFriend: false };
        }
        // Log other errors but maybe return a default state or rethrow
        console.error(`Error checking connection status with ${otherUsername}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`${error.response.data.message}`);
        }
        throw new Error(`Failed to check connection status with ${otherUsername}`);
    }
};

/**
 * Fetch outgoing friend requests initiated by the user.
 * GET /users/{username}/connections/initiated?status=pending
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose sent requests to fetch.
 * @param params Query parameters for pagination (page, limit)
 * @returns Promise with paginated connection data
 */
export const fetchSentRequests = async (
    apiClient: AxiosInstance,
    username: string,
    params: { page?: number; limit?: number } = {}
): Promise<PaginatedConnectionsResponse> => {
    try {
        const queryParams: Record<string, string | number> = {
            status: 'pending', // Always fetch pending requests
        };
        queryParams.page = params.page || 1; // Default page 1
        queryParams.limit = params.limit || 10; // Default limit 10

        const config: AxiosRequestConfig = { params: queryParams };

        const response = await apiClient.get<PaginatedConnectionsResponse>(
            `${API_ENDPOINT_USERS}/${username}/connections/initiated`,
            config
        );
        console.log(`Sent requests fetched successfully for ${username}:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching sent requests for ${username}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch sent requests for ${username}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to fetch sent requests for ${username}`);
    }
};

// End of file
