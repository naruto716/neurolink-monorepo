import { AxiosInstance } from 'axios';
import { FetchForumPostsParams, PaginatedForumPostsResponseDTO, PostCreateDTO, PostResponseDTO, PostDetailResponseDTO, // Add detail DTO
FetchTagsParams, PaginatedTagsResponseDTO, CommentCreateDTO, CommentResponseDTO, PaginatedCommentsResponseDTO, FetchCommentsParams, LikeResponse } from './types';
/**
 * Fetches a paginated list of forum posts from the API.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param params - Optional parameters for pagination, search, and filtering.
 * @returns A promise that resolves to the paginated posts response.
 */
export declare const fetchForumPosts: (apiClient: AxiosInstance, // Use AxiosInstance type
params?: FetchForumPostsParams) => Promise<PaginatedForumPostsResponseDTO>;
/**
 * Creates a new forum post.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postData - The data for the new post.
 * @returns A promise that resolves to the created post response.
 */
export declare const createPost: (apiClient: AxiosInstance, postData: PostCreateDTO) => Promise<PostResponseDTO>;
/**
 * Fetches a paginated list of tags from the API.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param params - Optional parameters for pagination and search.
 * @returns A promise that resolves to the paginated tags response.
 */
export declare const fetchForumTags: (// Renamed function
apiClient: AxiosInstance, params?: FetchTagsParams) => Promise<PaginatedTagsResponseDTO>;
/**
 * Fetches a specific forum post by its ID.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postId - The ID of the post to fetch.
 * @returns A promise that resolves to the detailed post response.
 */
export declare const fetchPostById: (apiClient: AxiosInstance, postId: string) => Promise<PostDetailResponseDTO>;
/**
 * Fetches comments for a specific forum post.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postId - The ID of the post whose comments to fetch.
 * @param params - Optional parameters for pagination.
 * @returns A promise that resolves to the paginated comments response.
 */
export declare const fetchCommentsForPost: (apiClient: AxiosInstance, postId: string, params?: FetchCommentsParams) => Promise<PaginatedCommentsResponseDTO>;
/**
 * Creates a new comment for a specific forum post.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postId - The ID of the post to comment on.
 * @param commentData - The data for the new comment.
 * @returns A promise that resolves to the created comment response.
 */
export declare const createCommentForPost: (apiClient: AxiosInstance, postId: string, commentData: CommentCreateDTO) => Promise<CommentResponseDTO>;
/**
 * Likes a specific forum post.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postId - The ID of the post to like.
 * @returns A promise that resolves to the like response message.
 */
export declare const likePost: (apiClient: AxiosInstance, postId: string) => Promise<LikeResponse>;
