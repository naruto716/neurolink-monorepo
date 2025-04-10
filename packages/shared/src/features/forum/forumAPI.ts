// packages/shared/src/features/forum/forumAPI.ts
import { AxiosInstance, AxiosRequestConfig } from 'axios'; // Import AxiosRequestConfig
import * as qs from 'qs'; // Import qs library
import {
  FetchForumPostsParams,
  PaginatedForumPostsResponseDTO,
  PostCreateDTO,
  PostResponseDTO,
  PostDetailResponseDTO, // Add detail DTO
  FetchTagsParams,
  PaginatedTagsResponseDTO,
  CommentCreateDTO,
  CommentResponseDTO,
  PaginatedCommentsResponseDTO,
  FetchCommentsParams,
  LikeResponse, // Add LikeResponse DTO
} from './types';

/**
 * Fetches a paginated list of forum posts from the API.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param params - Optional parameters for pagination, search, and filtering.
 * @returns A promise that resolves to the paginated posts response.
 */
export const fetchForumPosts = async (
  apiClient: AxiosInstance, // Use AxiosInstance type
  params?: FetchForumPostsParams
): Promise<PaginatedForumPostsResponseDTO> => {
  try {
    // Use qs for serialization to handle array format correctly
    const config: AxiosRequestConfig = {
        params: params,
        paramsSerializer: params => {
            return qs.stringify(params, { arrayFormat: 'repeat' });
        }
    };
    const response = await apiClient.get<PaginatedForumPostsResponseDTO>('/forum/posts', config); // Use config with serializer
    return response.data;
  } catch (error) {
    // TODO: Add more robust error handling specific to the application needs
    console.error('Error fetching forum posts:', error);
    // Re-throw or return a custom error object/structure
    throw error;
  }
};

/**
 * Creates a new forum post.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postData - The data for the new post.
 * @returns A promise that resolves to the created post response.
 */
export const createPost = async (
  apiClient: AxiosInstance,
  postData: PostCreateDTO
): Promise<PostResponseDTO> => {
  try {
    // The API expects the user identity from the X-User-Name header.
    // Assuming the apiClient is configured to send this header automatically.
    const response = await apiClient.post<PostResponseDTO>('/forum/posts', postData); // Removed /api/v1 prefix
    return response.data;
  } catch (error) {
    console.error('Error creating forum post:', error);
    throw error;
  }
};

/**
 * Fetches a paginated list of tags from the API.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param params - Optional parameters for pagination and search.
 * @returns A promise that resolves to the paginated tags response.
 */
export const fetchForumTags = async ( // Renamed function
  apiClient: AxiosInstance,
  params?: FetchTagsParams
): Promise<PaginatedTagsResponseDTO> => {
  try {
    const response = await apiClient.get<PaginatedTagsResponseDTO>('/forum/tags', { // Removed /api/v1 prefix
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

/**
 * Fetches a specific forum post by its ID.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postId - The ID of the post to fetch.
 * @returns A promise that resolves to the detailed post response.
 */
export const fetchPostById = async (
  apiClient: AxiosInstance,
  postId: string
): Promise<PostDetailResponseDTO> => {
  try {
    const response = await apiClient.get<PostDetailResponseDTO>(`/forum/posts/${postId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching forum post with ID ${postId}:`, error);
    throw error;
  }
};

/**
 * Fetches comments for a specific forum post.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postId - The ID of the post whose comments to fetch.
 * @param params - Optional parameters for pagination.
 * @returns A promise that resolves to the paginated comments response.
 */
export const fetchCommentsForPost = async (
  apiClient: AxiosInstance,
  postId: string,
  params?: FetchCommentsParams
): Promise<PaginatedCommentsResponseDTO> => {
  try {
    const response = await apiClient.get<PaginatedCommentsResponseDTO>(`/forum/posts/${postId}/comments`, {
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching comments for post ID ${postId}:`, error);
    throw error;
  }
};

/**
 * Creates a new comment for a specific forum post.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postId - The ID of the post to comment on.
 * @param commentData - The data for the new comment.
 * @returns A promise that resolves to the created comment response.
 */
export const createCommentForPost = async (
  apiClient: AxiosInstance,
  postId: string,
  commentData: CommentCreateDTO
): Promise<CommentResponseDTO> => {
  try {
    // Assuming X-User-Name header is handled by apiClient interceptor
    const response = await apiClient.post<CommentResponseDTO>(`/forum/posts/${postId}/comments`, commentData);
    return response.data;
  } catch (error) {
    console.error(`Error creating comment for post ID ${postId}:`, error);
    throw error;
  }
};


/**
 * Likes a specific forum post.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param postId - The ID of the post to like.
 * @returns A promise that resolves to the like response message.
 */
export const likePost = async (
  apiClient: AxiosInstance,
  postId: string
): Promise<LikeResponse> => {
  try {
    // Assuming X-User-Name header is handled by apiClient interceptor
    const response = await apiClient.post<LikeResponse>(`/forum/posts/${postId}/like`);
    return response.data;
  } catch (error) {
    console.error(`Error liking post ID ${postId}:`, error);
    throw error;
  }
};

// Add other API functions here as needed (updatePost, reportPost, etc.)