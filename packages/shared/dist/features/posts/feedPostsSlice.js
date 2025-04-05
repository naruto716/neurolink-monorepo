// packages/shared/src/features/posts/feedPostsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchFeedPosts as fetchFeedPostsAPI } from './postsAPI'; // Rename import to avoid conflict
// Initial state
const initialState = {
    posts: [],
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 10, // Default page size
    currentUsernameFilters: [],
    status: 'idle',
    error: null,
};
// Async thunk to fetch feed posts
export const fetchFeedPostsThunk = createAsyncThunk('feedPosts/fetchPosts', async ({ apiClient, usernames, pageNumber, pageSize }, { rejectWithValue }) => {
    try {
        // Use the imported API function
        const response = await fetchFeedPostsAPI(apiClient, {
            usernames,
            pageNumber: pageNumber ?? 1, // Default to page 1 if not provided
            pageSize: pageSize ?? 10, // Default to size 10 if not provided
        });
        // The API function already returns the correct PaginatedPostsResponse structure
        return response;
    }
    catch (error) {
        return rejectWithValue(error.message || 'Failed to fetch feed posts');
    }
});
// Create the feed posts slice
export const feedPostsSlice = createSlice({
    name: 'feedPosts',
    initialState,
    reducers: {
        clearFeedPosts: (state) => {
            state.posts = [];
            state.currentPage = 1;
            state.totalPages = 0;
            state.totalItems = 0;
            state.currentUsernameFilters = [];
            state.status = 'idle';
            state.error = null;
        },
        // Optional: Reducer to set usernames if needed before fetching
        setFeedUsernames: (state, action) => {
            state.currentUsernameFilters = action.payload;
            state.status = 'idle'; // Reset status when filters change
        },
        // Reducer to signal a refresh is needed (e.g., after a new post)
        requestFeedRefresh: (state) => {
            state.status = 'idle'; // Set status to idle to trigger refetch in component
            // Optionally reset pagination, though the component's effect should handle fetching page 1
            // state.currentPage = 1;
            // state.posts = []; // Don't clear posts here, let the component manage its display state
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFeedPostsThunk.pending, (state, action) => {
            state.status = 'loading';
            state.error = null;
            // Store the usernames for this request
            state.currentUsernameFilters = action.meta.arg.usernames;
            state.pageSize = action.meta.arg.pageSize ?? state.pageSize;
        })
            .addCase(fetchFeedPostsThunk.fulfilled, (state, action) => {
            state.status = 'succeeded';
            // Use the correct property names from the API response type
            state.posts = action.payload.items; // Use 'items'
            state.currentPage = action.payload.pageNumber; // Use 'pageNumber'
            state.totalItems = action.payload.totalItems; // Use 'totalItems'
            state.pageSize = action.payload.pageSize; // Use 'pageSize'
            state.totalPages = action.payload.totalPages; // Use 'totalPages'
            state.error = null;
        })
            .addCase(fetchFeedPostsThunk.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload ?? 'Unknown error fetching feed posts';
        });
    }
});
// Export actions and reducer
export const { clearFeedPosts, setFeedUsernames, requestFeedRefresh } = feedPostsSlice.actions;
// Selectors - Explicitly use SharedRootState
export const selectFeedPosts = (state) => state.feedPosts?.posts || [];
export const selectFeedPostsStatus = (state) => state.feedPosts?.status || 'idle';
export const selectFeedPostsError = (state) => state.feedPosts?.error || null;
export const selectFeedPostsCurrentPage = (state) => state.feedPosts?.currentPage || 1;
export const selectFeedPostsTotalPages = (state) => state.feedPosts?.totalPages || 0;
export const selectFeedPostsTotalItems = (state) => state.feedPosts?.totalItems || 0;
export const selectFeedPostsPageSize = (state) => state.feedPosts?.pageSize || 10;
export const selectFeedCurrentUsernameFilters = (state) => state.feedPosts?.currentUsernameFilters || [];
export default feedPostsSlice.reducer;
