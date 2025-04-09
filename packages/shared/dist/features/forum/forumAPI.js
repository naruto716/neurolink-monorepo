/**
 * Fetches a paginated list of forum posts from the API.
 *
 * @param apiClient - The Axios instance for making API calls.
 * @param params - Optional parameters for pagination, search, and filtering.
 * @returns A promise that resolves to the paginated posts response.
 */
export const fetchForumPosts = async (apiClient, // Use AxiosInstance type
params) => {
    try {
        const response = await apiClient.get('/forum/posts', {
            params: params, // Pass params directly, Axios handles query string conversion
        });
        return response.data;
    }
    catch (error) {
        // TODO: Add more robust error handling specific to the application needs
        console.error('Error fetching forum posts:', error);
        // Re-throw or return a custom error object/structure
        throw error;
    }
};
// Add other API functions here as needed (createPost, getPostById, etc.)
