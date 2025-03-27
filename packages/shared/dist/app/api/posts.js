import api from './api';
/**
 * Get all posts with pagination
 * @param page Page number (starts at 1)
 * @param pageSize Number of posts per page
 * @returns Promise with posts response
 */
export const getPosts = async (page = 1, pageSize = 10) => {
    try {
        const response = await api.get('/api/v1/posts', {
            params: { page, pageSize }
        });
        return response.data;
    }
    catch (error) {
        console.error('Failed to fetch posts:', error);
        throw error;
    }
};
/**
 * Get a single post by ID
 * @param id Post ID
 * @returns Promise with post data
 */
export const getPostById = async (id) => {
    try {
        const response = await api.get(`/api/v1/posts/${id}`);
        return response.data;
    }
    catch (error) {
        console.error(`Failed to fetch post with ID ${id}:`, error);
        throw error;
    }
};
/**
 * Create a new post
 * @param postData Post creation data
 * @returns Promise with created post
 */
export const createPost = async (postData) => {
    try {
        const response = await api.post('/api/v1/posts', postData);
        return response.data;
    }
    catch (error) {
        console.error('Failed to create post:', error);
        throw error;
    }
};
/**
 * Like a post
 * @param id Post ID
 * @returns Promise with updated post
 */
export const likePost = async (id) => {
    try {
        const response = await api.post(`/api/v1/posts/${id}/like`);
        return response.data;
    }
    catch (error) {
        console.error(`Failed to like post with ID ${id}:`, error);
        throw error;
    }
};
