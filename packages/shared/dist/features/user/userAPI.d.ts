import { AxiosInstance } from 'axios';
import { User, Tag, PaginatedUsersResponse, UserProfileInput } from './types';
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
