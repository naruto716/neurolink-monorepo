import { AxiosInstance } from 'axios';
import { FetchForumPostsParams, PaginatedForumPostsResponseDTO } from './types';
/**
 * Fetches a paginated list of forum posts from the API.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param params - Optional parameters for pagination, search, and filtering.
 * @returns A promise that resolves to the paginated posts response.
 */
export declare const fetchForumPosts: (apiClient: AxiosInstance, // Use AxiosInstance type
params?: FetchForumPostsParams) => Promise<PaginatedForumPostsResponseDTO>;
