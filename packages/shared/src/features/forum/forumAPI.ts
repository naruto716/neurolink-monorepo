// packages/shared/src/features/forum/forumAPI.ts
import { AxiosInstance } from 'axios'; // Import AxiosInstance from axios
import { FetchForumPostsParams, PaginatedForumPostsResponseDTO } from './types';

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
    const response = await apiClient.get<PaginatedForumPostsResponseDTO>('/forum/posts', { // Removed /api/v1 prefix
      params: params, // Pass params directly, Axios handles query string conversion
    });
    return response.data;
  } catch (error) {
    // TODO: Add more robust error handling specific to the application needs
    console.error('Error fetching forum posts:', error);
    // Re-throw or return a custom error object/structure
    throw error;
  }
};

// Add other API functions here as needed (createPost, getPostById, etc.)