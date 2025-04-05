const API_ENDPOINT_USERS = '/users'; // Base endpoint for users
/**
 * Fetch posts for a specific user with pagination.
 * @param apiClient The Axios instance to use.
 * @param username The username of the user whose posts to fetch.
 * @param page The page number to fetch (default: 1).
 * @param limit The number of posts per page (default: 24).
 * @returns Promise with paginated post data.
 */
export const fetchUserPosts = async (apiClient, username, page = 1, limit = 24) => {
    try {
        const config = {
            params: { page, limit },
        };
        const response = await apiClient.get(`${API_ENDPOINT_USERS}/${username}/posts`, config);
        console.log(`Posts fetched successfully for ${username}:`, response.data);
        return response.data;
    }
    catch (error) {
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
export const fetchComments = async (api, // Pass the configured axios instance
postId, page = 1, limit = 5 // Default limit to 5 as requested
) => {
    try {
        const response = await api.get(`/posts/${postId}/comments`, {
            params: { page, limit },
        });
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching comments for post ${postId}:`, error);
        // Rethrow or handle error appropriately for the UI
        throw error;
    }
};
export const createComment = async (api, postId, payload) => {
    try {
        // Assuming the endpoint returns the created comment
        const response = await api.post(`/posts/${postId}/comments`, payload);
        return response.data;
    }
    catch (error) {
        console.error(`Error creating comment for post ${postId}:`, error);
        throw error;
    }
};
