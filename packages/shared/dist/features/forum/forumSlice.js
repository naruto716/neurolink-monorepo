// packages/shared/src/features/forum/forumSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'; // Import AsyncThunk
import { fetchForumPosts as fetchForumPostsAPI } from './forumAPI';
// Initial state
const initialState = {
    posts: [],
    status: 'idle',
    error: null,
    currentPage: 0, // 0 indicates not loaded yet, API uses 1-based indexing
    totalPages: 0,
    totalPosts: 0,
};
// Async thunk for fetching forum posts
export const fetchForumPosts = createAsyncThunk('forum/fetchPosts', async ({ apiClient, params }, { rejectWithValue }) => {
    try {
        const response = await fetchForumPostsAPI(apiClient, params);
        return response;
    }
    catch (error) {
        const message = error.response?.data?.detail || error.message || 'Failed to fetch forum posts';
        return rejectWithValue(message);
    }
});
// Create the slice
const forumSlice = createSlice({
    name: 'forum',
    initialState,
    reducers: {
        // Add any specific synchronous reducers here if needed later
        resetForumState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchForumPosts.pending, (state) => {
            state.status = 'loading';
            state.error = null; // Clear error on new request
        })
            // Explicitly type the action to include meta information
            .addCase(fetchForumPosts.fulfilled, (state, action) => {
            state.status = 'succeeded';
            // Determine if it's a pagination request (page > 1) or initial load/refresh
            const requestedPage = action.meta.arg.params?.page; // Get requested page from meta.arg
            const isPaginating = requestedPage && requestedPage > 1;
            if (isPaginating) {
                // Append new posts if paginating
                state.posts = [...state.posts, ...action.payload.posts];
            }
            else {
                // Replace posts if it's the first page or a refresh
                state.posts = action.payload.posts;
            }
            state.currentPage = requestedPage || 1; // Use the requested page number from meta.arg
            state.totalPages = action.payload.total_pages;
            state.totalPosts = action.payload.total_posts;
            state.error = null;
        })
            .addCase(fetchForumPosts.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload ?? 'Unknown error fetching forum posts';
        });
    },
});
// Export actions and reducer
export const { resetForumState } = forumSlice.actions;
export default forumSlice.reducer;
// Selectors
export const selectForumPosts = (state) => state.forum.posts;
export const selectForumStatus = (state) => state.forum.status;
export const selectForumError = (state) => state.forum.error;
export const selectForumCurrentPage = (state) => state.forum.currentPage;
export const selectForumTotalPages = (state) => state.forum.totalPages;
export const selectForumTotalPosts = (state) => state.forum.totalPosts;
