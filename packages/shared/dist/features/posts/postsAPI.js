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
