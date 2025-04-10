import { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as qs from 'qs'; // Import qs library
// Import user-specific types
import { User, Tag, PaginatedUsersResponse, UserProfileInput, PaginatedConnectionsResponse, Connection } from './types';
// Explicitly import Commitment types from the correct location
import {
    Commitment,
    PaginatedCommitmentsResponse,
    PaginatedSentInvitationsResponse,
    PaginatedReceivedInvitationsResponse,
    ReceivedInvitation,
    CreateCommitmentRequest,
    PaginatedSentInvitationsDetailResponse // Add new type import
} from '../commitments/types';

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

export const fetchUserTags = async (apiClient: AxiosInstance, params: FetchTagsParams = {}): Promise<Tag[]> => { // Renamed function
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

// --- Commitment API Functions ---

const API_ENDPOINT_COMMITMENTS = '/commitment/users'; // Base endpoint for user commitments

export interface FetchUserCommitmentsParams {
    role?: 'organizer' | 'participant'; // Make role specific or keep string if API accepts others
    pageNumber?: number;
    pageSize?: number;
    sortOrder?: 'asc' | 'desc'; // Add sortOrder parameter
}

/**
 * Fetch commitments for a specific user with pagination and optional role filtering.
 * GET /Commitment/users/{username}
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose commitments to fetch.
 * @param params Query parameters for filtering and pagination (role, pageNumber, pageSize)
 * @returns Promise with paginated commitment data
 */
export const fetchUserCommitments = async (
    apiClient: AxiosInstance,
    username: string,
    params: FetchUserCommitmentsParams = {}
 ): Promise<PaginatedCommitmentsResponse> => {
     try {
         const queryParams: Record<string, string | number> = {};
         // Only add role to params if it's 'organizer' or 'participant'
         if (params.role === 'organizer' || params.role === 'participant') {
             queryParams.role = params.role;
         }
         queryParams.pageNumber = params.pageNumber || 1; // Default page 1
         queryParams.pageSize = params.pageSize || 10; // Default limit 10
        queryParams.sortOrder = params.sortOrder || 'desc'; // Add sortOrder, default 'desc'

        const config: AxiosRequestConfig = { params: queryParams };

        const response = await apiClient.get<PaginatedCommitmentsResponse>(
            `${API_ENDPOINT_COMMITMENTS}/${username}`,
            config
        );
        console.log(`Commitments fetched successfully for ${username} with params:`, queryParams, "Response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching commitments for ${username}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch commitments for ${username}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to fetch commitments for ${username}`);
    }
};

/**
 * Fetch a single commitment by its ID.
 * GET /commitment/{id}
 * @param apiClient The Axios instance to use.
 * @param id The ID of the commitment to fetch.
 * @returns Promise with the commitment data.
 */
export const fetchCommitmentById = async (
    apiClient: AxiosInstance,
    id: number | string // Accept number or string for ID
): Promise<Commitment> => { // Use Commitment type from correct import
    try {
        const response = await apiClient.get<Commitment>(`/commitment/${id}`); // Use lowercase endpoint
        console.log(`Commitment fetched successfully for ID: ${id}`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching commitment by ID ${id}:`, error.response?.data || error.message);
        // Handle 404 specifically
        if (error.response && error.response.status === 404) {
            throw new Error(`Commitment not found: ${id}`);
        }
        // For network errors or other API failures
        throw new Error(error.response?.data?.message || `Failed to fetch commitment: ${id}`);
    }
};


// --- Commitment Invitation API Functions ---

const API_ENDPOINT_COMMITMENT_INVITATIONS = '/commitment/invitations'; // Base endpoint

export interface FetchInvitationsParams {
    pageNumber?: number;
    pageSize?: number;
}

/**
 * Fetch sent commitment invitations for a specific user.
 * GET /commitment/invitations/sent/{username}
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose sent invitations to fetch.
 * @param params Query parameters for pagination (pageNumber, pageSize)
 * @returns Promise with paginated sent invitation data (which are Commitments)
 */
export const fetchSentInvitations = async (
    apiClient: AxiosInstance,
    username: string,
    params: FetchInvitationsParams = {}
): Promise<PaginatedSentInvitationsResponse> => {
    try {
        const queryParams: Record<string, string | number> = {};
        queryParams.pageNumber = params.pageNumber || 1; // Default page 1
        queryParams.pageSize = params.pageSize || 10; // Default limit 10

        const config: AxiosRequestConfig = { params: queryParams };

        const response = await apiClient.get<PaginatedSentInvitationsResponse>(
            `${API_ENDPOINT_COMMITMENT_INVITATIONS}/sent/${username}`,
            config
        );
        console.log(`Sent invitations fetched successfully for ${username} with params:`, queryParams, "Response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching sent invitations for ${username}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch sent invitations for ${username}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to fetch sent invitations for ${username}`);
    }
};

/**
 * Fetch detailed sent invitations for a specific user with pagination.
 * GET /Commitment/invitations/detail/sent/{username}
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose sent invitations to fetch.
 * @param params Query parameters for pagination (pageNumber, pageSize)
 * @returns Promise with paginated detailed sent invitation data
 */
export const fetchSentInvitationsDetail = async (
    apiClient: AxiosInstance,
    username: string,
    params: FetchInvitationsParams = {} // Reuse FetchInvitationsParams
): Promise<PaginatedSentInvitationsDetailResponse> => {
    try {
        const queryParams: Record<string, string | number> = {};
        queryParams.pageNumber = params.pageNumber || 1; // Default page 1
        queryParams.pageSize = params.pageSize || 10; // Default page 10

        const config: AxiosRequestConfig = { params: queryParams };

        const response = await apiClient.get<PaginatedSentInvitationsDetailResponse>(
            `/commitment/invitations/detail/sent/${username}`, // New endpoint
            config
        );
        console.log(`Detailed sent invitations fetched successfully for ${username}:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching detailed sent invitations for ${username}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch detailed sent invitations for ${username}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to fetch detailed sent invitations for ${username}`);
    }
};

/**
 * Fetch received commitment invitations for a specific user.
 * GET /commitment/invitations/received/{username}
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose received invitations to fetch.
 * @param params Query parameters for pagination (pageNumber, pageSize)
 * @returns Promise with paginated received invitation data
 */
export const fetchReceivedInvitations = async (
    apiClient: AxiosInstance,
    username: string,
    params: FetchInvitationsParams = {}
): Promise<PaginatedReceivedInvitationsResponse> => {
    try {
        const queryParams: Record<string, string | number> = {};
        queryParams.pageNumber = params.pageNumber || 1; // Default page 1
        queryParams.pageSize = params.pageSize || 10; // Default limit 10

        const config: AxiosRequestConfig = { params: queryParams };

        const response = await apiClient.get<PaginatedReceivedInvitationsResponse>(
            `${API_ENDPOINT_COMMITMENT_INVITATIONS}/received/${username}`,
            config
        );
        console.log(`Received invitations fetched successfully for ${username} with params:`, queryParams, "Response:", response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching received invitations for ${username}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to fetch received invitations for ${username}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to fetch received invitations for ${username}`);
    }
};

/**
 * Respond to a received commitment invitation.
 * PUT /commitment/invitations/{id}
 * @param apiClient The Axios instance to use.
 * @param invitationId The ID of the invitation to respond to.
 * @param status The new status ('accepted' or 'rejected').
 * @returns Promise with the updated invitation data.
 */
export const respondToCommitmentInvitation = async (
    apiClient: AxiosInstance,
    invitationId: number,
    status: 'accepted' | 'rejected'
): Promise<ReceivedInvitation> => { // The response contains the updated invitation
    try {
        const response = await apiClient.put<ReceivedInvitation>(
            `${API_ENDPOINT_COMMITMENT_INVITATIONS}/${invitationId}`,
            { status } // Request body contains the new status
        );
        console.log(`Invitation ${invitationId} response set to ${status} successfully:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error responding to invitation ${invitationId}:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to respond to invitation ${invitationId}: ${error.response.data.message}`);
        }
        throw new Error(`Failed to respond to invitation ${invitationId}`);
    }
};

// Fetches the count of pending commitment invitations for the current user
export const fetchPendingInvitationCount = async (apiClient: AxiosInstance): Promise<number> => {
  try {
    // Assuming the endpoint directly returns the number
    const response = await apiClient.get<number>('/commitment/my/invitations/pending/count');
    // Ensure a number is returned, default to 0 if response is unexpected
    return typeof response.data === 'number' ? response.data : 0;
  } catch (error) {
    console.error("API Error fetching pending invitation count:", error);
    // Re-throw or handle error as appropriate for your app's error handling strategy
    throw error; 
  }
};

// Fetches the count of accepted commitments for the current user
export const fetchAcceptedCommitmentCount = async (apiClient: AxiosInstance): Promise<number> => {
  try {
    // Assuming the endpoint directly returns the number
    const response = await apiClient.get<number>('/commitment/my/commitments/accepted/count');
     // Ensure a number is returned, default to 0 if response is unexpected
    return typeof response.data === 'number' ? response.data : 0;
  } catch (error) {
    console.error("API Error fetching accepted commitment count:", error);
     // Re-throw or handle error as appropriate for your app's error handling strategy
    throw error;
  }
};


/**
 * Create a new commitment.
 * POST /commitment
 * @param apiClient The Axios instance to use.
 * @param commitmentData The data for the new commitment.
 * @returns Promise with the created commitment data.
 */
export const createCommitment = async (
    apiClient: AxiosInstance,
    commitmentData: CreateCommitmentRequest
): Promise<Commitment> => { // Returns the created Commitment
    try {
        // The API endpoint is /api/v1/Commitment, so just /commitment relative to base URL
        const response = await apiClient.post<Commitment>(`/commitment`, commitmentData);
        console.log(`Commitment created successfully:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error(`Error creating commitment:`, error.response?.data || error.message);
        if (error.response?.data?.message) {
            throw new Error(`Failed to create commitment: ${error.response.data.message}`);
        }
        throw new Error(`Failed to create commitment`);
    }
};


// End of file
