// Default limit for posts per page
const DEFAULT_POSTS_LIMIT = 10; // Let's set a default, e.g., 10
// --- End Feed Types ---
/**
 * Fetches posts for a specific user with pagination.
 * Corresponds to GET /users/{username}/posts
 */
export const fetchUserPosts = async (api, username, page = 1, limit = DEFAULT_POSTS_LIMIT) => {
    try {
        const response = await api.get(`/users/${username}/posts`, {
            params: { page, limit },
        });
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching posts for user ${username}:`, error);
        throw error;
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
/**
 * Toggles the like status for a specific post.
 * Corresponds to POST /api/v1/Posts/{postId}/likes/toggle
 */
export const togglePostLike = async (api, postId) => {
    try {
        // Correct the endpoint path to lowercase 'posts'
        const response = await api.post(`/posts/${postId}/likes/toggle`);
        return response.data;
    }
    catch (error) {
        console.error(`Error toggling like for post ${postId}:`, error);
        throw error; // Rethrow to be handled by the calling function
    }
};
/**
 * Fetches posts for a list of usernames (feed).
 * Corresponds to POST /api/v1/posts/by-usernames
 */
export const fetchFeedPosts = async (api, payload) => {
    try {
        // Ensure defaults if not provided
        const dataToSend = {
            usernames: payload.usernames,
            pageNumber: payload.pageNumber ?? 1,
            pageSize: payload.pageSize ?? 10, // Default page size, adjust if needed
        };
        const response = await api.post('/posts/by-usernames', dataToSend);
        return response.data;
    }
    catch (error) {
        console.error(`Error fetching feed posts:`, error);
        throw error;
    }
};
