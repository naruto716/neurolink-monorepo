import { AxiosInstance } from 'axios';
import { PaginatedPostsResponse, Post, Comment, PaginatedCommentsResponse } from './types';
export interface FetchFeedPostsPayload {
    usernames: string[];
    pageNumber?: number;
    pageSize?: number;
}
export interface PaginatedFeedResponse {
    pageNumber: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    items: Post[];
}
/**
 * Fetches posts for a specific user with pagination.
 * Corresponds to GET /users/{username}/posts
 */
export declare const fetchUserPosts: (api: AxiosInstance, username: string, page?: number, limit?: number) => Promise<PaginatedPostsResponse>;
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
export interface ToggleLikeResponse {
    isLiked: boolean;
    likesCount: number;
}
/**
 * Toggles the like status for a specific post.
 * Corresponds to POST /api/v1/Posts/{postId}/likes/toggle
 */
export declare const togglePostLike: (api: AxiosInstance, postId: number) => Promise<ToggleLikeResponse>;
/**
 * Fetches posts for a list of usernames (feed).
 * Corresponds to POST /api/v1/posts/by-usernames
 */
export declare const fetchFeedPosts: (api: AxiosInstance, payload: FetchFeedPostsPayload) => Promise<PaginatedFeedResponse>;
