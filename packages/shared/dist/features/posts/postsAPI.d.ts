import { AxiosInstance } from 'axios';
import { PaginatedPostsResponse } from './types';
/**
 * Fetch posts for a specific user with pagination.
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose posts to fetch.
 * @param page The page number to fetch (default: 1).
 * @param limit The number of posts per page (default: 24).
 * @returns Promise with paginated post data.
 */
export declare const fetchUserPosts: (apiClient: AxiosInstance, username: string, page?: number, limit?: number) => Promise<PaginatedPostsResponse>;
