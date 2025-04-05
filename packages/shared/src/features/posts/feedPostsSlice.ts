// packages/shared/src/features/posts/feedPostsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosInstance } from 'axios';
import { Post, PaginatedPostsResponse, FetchPostsByUsernamePayload } from './types'; // Use the updated types
import { fetchFeedPosts as fetchFeedPostsAPI } from './postsAPI'; // Rename import to avoid conflict
import { SharedRootState } from '../../app/store/store';

// Define the state structure for feed posts
export interface FeedPostsState {
  posts: Post[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  currentUsernameFilters: string[]; // Store the usernames used for the current fetch
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state
const initialState: FeedPostsState = {
  posts: [],
  currentPage: 1,
  totalPages: 0,
  totalItems: 0,
  pageSize: 10, // Default page size
  currentUsernameFilters: [],
  status: 'idle',
  error: null,
};

// Define parameters for the async thunk
interface FetchFeedPostsThunkArgs extends FetchPostsByUsernamePayload {
  apiClient: AxiosInstance;
}

// Async thunk to fetch feed posts
export const fetchFeedPostsThunk = createAsyncThunk<
  PaginatedPostsResponse, // Return type matches API response
  FetchFeedPostsThunkArgs,
  { rejectValue: string }
>(
  'feedPosts/fetchPosts',
  async ({ apiClient, usernames, pageNumber, pageSize }, { rejectWithValue }) => {
    try {
      // Use the imported API function
      const response = await fetchFeedPostsAPI(apiClient, {
        usernames,
        pageNumber: pageNumber ?? 1, // Default to page 1 if not provided
        pageSize: pageSize ?? 10,   // Default to size 10 if not provided
      });
      // The API function already returns the correct PaginatedPostsResponse structure
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch feed posts');
    }
  }
);

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
    setFeedUsernames: (state, action: PayloadAction<string[]>) => {
        state.currentUsernameFilters = action.payload;
        state.status = 'idle'; // Reset status when filters change
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
      .addCase(fetchFeedPostsThunk.fulfilled, (state, action: PayloadAction<PaginatedPostsResponse>) => {
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
export const { clearFeedPosts, setFeedUsernames } = feedPostsSlice.actions;

// Selectors - Explicitly use SharedRootState
export const selectFeedPosts = (state: SharedRootState): Post[] =>
  state.feedPosts?.posts || [];

export const selectFeedPostsStatus = (state: SharedRootState): FeedPostsState['status'] =>
  state.feedPosts?.status || 'idle';

export const selectFeedPostsError = (state: SharedRootState): string | null =>
  state.feedPosts?.error || null;

export const selectFeedPostsCurrentPage = (state: SharedRootState): number =>
  state.feedPosts?.currentPage || 1;

export const selectFeedPostsTotalPages = (state: SharedRootState): number =>
  state.feedPosts?.totalPages || 0;

export const selectFeedPostsTotalItems = (state: SharedRootState): number =>
    state.feedPosts?.totalItems || 0;

export const selectFeedPostsPageSize = (state: SharedRootState): number =>
    state.feedPosts?.pageSize || 10;

export const selectFeedCurrentUsernameFilters = (state: SharedRootState): string[] =>
    state.feedPosts?.currentUsernameFilters || [];


export default feedPostsSlice.reducer;