import { AxiosInstance } from 'axios';
import { User, Tag, PaginatedUsersResponse, UserProfileInput, PaginatedConnectionsResponse, Connection } from './types';
/**
 * Get the current user profile
 * @param apiClient The Axios instance to use.
 * @returns Promise with user data
 */
export declare const fetchCurrentUser: (apiClient: AxiosInstance) => Promise<User>;
/**
 * Create a new user profile during onboarding
 * @param apiClient The Axios instance to use.
 * @param userData The user data to create (using UserProfileInput type)
 * @returns Promise with the created user data
 */
export declare const createUser: (apiClient: AxiosInstance, userData: UserProfileInput) => Promise<User>;
/**
 * Fetch a user profile by username
 * @param apiClient The Axios instance to use.
 * @param username The username of the user to fetch.
 * @returns Promise with user data
 */
export declare const fetchUserByUsername: (apiClient: AxiosInstance, username: string) => Promise<User>;
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
    value?: string;
    page?: number;
    limit?: number;
    fuzzyThreshold?: number;
}
export declare const fetchTags: (apiClient: AxiosInstance, params?: FetchTagsParams) => Promise<Tag[]>;
export declare const uploadProfilePicture: (apiClient: AxiosInstance, file: File) => Promise<string>;
export interface FetchUsersParams {
    q?: string;
    minAge?: number;
    maxAge?: number;
    tagTypes?: string[];
    tagValues?: string[];
    tags?: Tag[];
    page?: number;
    limit?: number;
}
/**
 * Fetch a list of users with pagination and filtering (GET /users)
 * @param apiClient The Axios instance to use.
 * @param params Query parameters for filtering and pagination
 * @returns Promise with paginated user data
 */
export declare const fetchUsers: (apiClient: AxiosInstance, params?: FetchUsersParams) => Promise<PaginatedUsersResponse>;
/**
 * Fetch a list of friends for a specific user with pagination
 * GET /users/{username}/friends
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose friends to fetch.
 * @param params Query parameters for pagination (page, limit)
 * @returns Promise with paginated user data (friends)
 */
export declare const fetchUserFriends: (apiClient: AxiosInstance, username: string, params?: {
    page?: number;
    limit?: number;
}) => Promise<PaginatedUsersResponse>;
/**
 * Fetch the friend count for a specific user
 * GET /users/{username}/friends/count
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose friend count to fetch.
 * @returns Promise with the friend count (number)
 */
export declare const fetchUserFriendCount: (apiClient: AxiosInstance, username: string) => Promise<number>;
/**
 * Fetch incoming friend requests for a specific user with pagination
 * GET /users/{username}/connections/received?status=pending
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose pending requests to fetch.
 * @param params Query parameters for pagination (page, limit)
 * @returns Promise with paginated connection data
 */
export declare const fetchPendingRequests: (apiClient: AxiosInstance, username: string, params?: {
    page?: number;
    limit?: number;
}) => Promise<PaginatedConnectionsResponse>;
/**
 * Accept an incoming friend request
 * PATCH /users/me/connections/{initiatorUsername}/accept
 * @param apiClient The Axios instance to use.
 * @param initiatorUsername The username of the user who sent the request.
 * @returns Promise with the updated connection data.
 */
export declare const acceptFriendRequest: (apiClient: AxiosInstance, initiatorUsername: string) => Promise<Connection>;
/**
 * Decline or cancel a friend request/connection
 * DELETE /users/me/connections/{otherUsername}
 * @param apiClient The Axios instance to use.
 * @param otherUsername The username of the other user in the connection.
 * @returns Promise<void>
 */
export declare const declineFriendRequest: (apiClient: AxiosInstance, otherUsername: string) => Promise<void>;
/**
 * Send a friend request to another user.
 * POST /users/me/connections/{friendUsername}
 * @param apiClient The Axios instance to use.
 * @param friendUsername The username of the user to send the request to.
 * @returns Promise with the new connection data (likely status: 'pending').
 */
export declare const sendFriendRequest: (apiClient: AxiosInstance, friendUsername: string) => Promise<Connection>;
/**
 * Check the friendship status between the current user and another user.
 * GET /users/me/friends/{otherUsername}/status
 * @param apiClient The Axios instance to use.
 * @param otherUsername The username of the other user to check the status with.
 * @returns Promise<{ isFriend: boolean }>
 */
export declare const fetchConnectionStatus: (apiClient: AxiosInstance, otherUsername: string) => Promise<{
    isFriend: boolean;
}>;
/**
 * Fetch outgoing friend requests initiated by the user.
 * GET /users/{username}/connections/initiated?status=pending
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose sent requests to fetch.
 * @param params Query parameters for pagination (page, limit)
 * @returns Promise with paginated connection data
 */
export declare const fetchSentRequests: (apiClient: AxiosInstance, username: string, params?: {
    page?: number;
    limit?: number;
}) => Promise<PaginatedConnectionsResponse>;
