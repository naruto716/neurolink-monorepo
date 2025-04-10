import { AxiosInstance } from 'axios';
import { PaginatedPostsResponse, Post, Comment, PaginatedCommentsResponse } from './types';

// Default limit for posts per page
const DEFAULT_POSTS_LIMIT = 10; // Let's set a default, e.g., 10

// --- Feed Types ---
export interface FetchFeedPostsPayload {
  usernames: string[];
  pageNumber?: number; // Match API schema (pageNumber, pageSize)
  pageSize?: number;
}

export interface PaginatedFeedResponse {
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  items: Post[]; // Posts are nested under 'items'
}
// --- End Feed Types ---

/**
 * Fetches posts for a specific user with pagination.
 * Corresponds to GET /users/{username}/posts
 */
export const fetchUserPosts = async (
  api: AxiosInstance,
  username: string,
  page: number = 1,
  limit: number = DEFAULT_POSTS_LIMIT
): Promise<PaginatedPostsResponse> => {
  try {
    const response = await api.get<PaginatedPostsResponse>(`/users/${username}/posts`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching posts for user ${username}:`, error);
    throw error;
  }
};

/**
 * Fetches comments for a specific post with pagination.
 * Corresponds to GET /api/v1/Posts/{postId}/comments
 */
export const fetchComments = async (
  api: AxiosInstance, // Pass the configured axios instance
  postId: number,
  page: number = 1,
  limit: number = 5 // Default limit to 5 as requested
): Promise<PaginatedCommentsResponse> => {
  try {
    const response = await api.get<PaginatedCommentsResponse>(`/posts/${postId}/comments`, {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    // Rethrow or handle error appropriately for the UI
    throw error;
  }
};

// --- Add function to create a comment (POST /api/v1/Posts/{postId}/comments) --- 
// Placeholder for now, needed for the input UI
export interface CreateCommentPayload {
  content: string;
}

export const createComment = async (
  api: AxiosInstance,
  postId: number,
  payload: CreateCommentPayload
): Promise<Comment> => {
  try {
    // Assuming the endpoint returns the created comment
    const response = await api.post<Comment>(`/posts/${postId}/comments`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error creating comment for post ${postId}:`, error);
    throw error;
  }
};

// Define the expected response type for the like toggle endpoint
export interface ToggleLikeResponse {
  isLiked: boolean;
  likesCount: number;
}

/**
 * Toggles the like status for a specific post.
 * Corresponds to POST /api/v1/Posts/{postId}/likes/toggle
 */
export const togglePostLike = async (
  api: AxiosInstance,
  postId: number
): Promise<ToggleLikeResponse> => {
  try {
    // Correct the endpoint path to lowercase 'posts'
    const response = await api.post<ToggleLikeResponse>(`/posts/${postId}/likes/toggle`);
    return response.data;
  } catch (error) {
    console.error(`Error toggling like for post ${postId}:`, error);
    throw error; // Rethrow to be handled by the calling function
  }
};

/**
 * Fetches posts for a list of usernames (feed).
 * Corresponds to POST /api/v1/posts/by-usernames
 */
export const fetchFeedPosts = async (
  api: AxiosInstance,
  payload: FetchFeedPostsPayload
): Promise<PaginatedFeedResponse> => {
  try {
    // Ensure defaults if not provided
    const dataToSend = {
      usernames: payload.usernames,
      pageNumber: payload.pageNumber ?? 1,
      pageSize: payload.pageSize ?? 10, // Default page size, adjust if needed
    };
    const response = await api.post<PaginatedFeedResponse>('/posts/by-usernames', dataToSend);
    return response.data;
  } catch (error) {
    console.error(`Error fetching feed posts:`, error);
    throw error;
  }
};
