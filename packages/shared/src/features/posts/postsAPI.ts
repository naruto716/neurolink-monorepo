import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { PaginatedPostsResponse, Post, Comment, PaginatedCommentsResponse } from './types';

const API_ENDPOINT_USERS = '/users'; // Base endpoint for users

/**
 * Fetch posts for a specific user with pagination.
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose posts to fetch.
 * @param page The page number to fetch (default: 1).
 * @param limit The number of posts per page (default: 24).
 * @returns Promise with paginated post data.
 */
export const fetchUserPosts = async (
  apiClient: AxiosInstance,
  username: string,
  page: number = 1,
  limit: number = 24
): Promise<PaginatedPostsResponse> => {
  try {
    const config: AxiosRequestConfig = {
      params: { page, limit },
    };
    const response = await apiClient.get<PaginatedPostsResponse>(
      `${API_ENDPOINT_USERS}/${username}/posts`,
      config
    );
    console.log(`Posts fetched successfully for ${username}:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching posts for ${username}:`, error.response?.data || error.message);
    // Provide a more specific error message if available
    if (error.response?.data?.message) {
      throw new Error(`Failed to fetch posts: ${error.response.data.message}`);
    }
    // For network errors or other API failures
    throw new Error('Failed to fetch posts');
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
