import { AxiosInstance } from 'axios';
import { PaginatedPostsResponse, Comment, PaginatedCommentsResponse } from './types';
/**
 * Fetch posts for a specific user with pagination.
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose posts to fetch.
 * @param page The page number to fetch (default: 1).
 * @param limit The number of posts per page (default: 24).
 * @returns Promise with paginated post data.
 */
export declare const fetchUserPosts: (apiClient: AxiosInstance, username: string, page?: number, limit?: number) => Promise<PaginatedPostsResponse>;
/**
 * Fetches comments for a specific post with pagination.
 * Corresponds to GET /api/v1/Posts/{postId}/comments
 */
export declare const fetchComments: (api: AxiosInstance, // Pass the configured axios instance
postId: number, page?: number, limit?: number) => Promise<PaginatedCommentsResponse>;
export interface CreateCommentPayload {
    content: string;
}
export declare const createComment: (api: AxiosInstance, postId: number, payload: CreateCommentPayload) => Promise<Comment>;
