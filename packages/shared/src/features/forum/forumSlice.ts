// packages/shared/src/features/forum/forumSlice.ts
import { createSlice, createAsyncThunk, PayloadAction, AsyncThunk } from '@reduxjs/toolkit'; // Import AsyncThunk
import { AxiosInstance } from 'axios';
import { ForumPostDTO, PaginatedForumPostsResponseDTO, FetchForumPostsParams } from './types';
import { fetchForumPosts as fetchForumPostsAPI } from './forumAPI';
import { SharedRootState } from '../../app/store/store'; // Assuming SharedRootState path

// Define the shape of the forum state
export interface ForumState { // Export the interface
  posts: ForumPostDTO[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

// Initial state
const initialState: ForumState = {
  posts: [],
  status: 'idle',
  error: null,
  currentPage: 0, // 0 indicates not loaded yet, API uses 1-based indexing
  totalPages: 0,
  totalPosts: 0,
};

// Define the type for the async thunk arguments to access meta.arg correctly
type FetchForumPostsThunkArg = { apiClient: AxiosInstance; params?: FetchForumPostsParams };

// Async thunk for fetching forum posts
export const fetchForumPosts = createAsyncThunk<
  PaginatedForumPostsResponseDTO, // Return type
  FetchForumPostsThunkArg, // Use the defined argument type
  { rejectValue: string } // Type for rejected action payload
>(
  'forum/fetchPosts',
  async ({ apiClient, params }, { rejectWithValue }) => {
    try {
      const response = await fetchForumPostsAPI(apiClient, params);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch forum posts';
      return rejectWithValue(message);
    }
  }
);

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
      .addCase(fetchForumPosts.fulfilled, (
        state,
        action: PayloadAction<PaginatedForumPostsResponseDTO, string, { arg: FetchForumPostsThunkArg }>
      ) => {
        state.status = 'succeeded';
        // Determine if it's a pagination request (page > 1) or initial load/refresh
        const requestedPage = action.meta.arg.params?.page; // Get requested page from meta.arg
        const isPaginating = requestedPage && requestedPage > 1;

        if (isPaginating) {
           // Append new posts if paginating
           state.posts = [...state.posts, ...action.payload.posts];
        } else {
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
export const selectForumPosts = (state: SharedRootState): ForumPostDTO[] => state.forum.posts;
export const selectForumStatus = (state: SharedRootState): ForumState['status'] => state.forum.status;
export const selectForumError = (state: SharedRootState): string | null => state.forum.error;
export const selectForumCurrentPage = (state: SharedRootState): number => state.forum.currentPage;
export const selectForumTotalPages = (state: SharedRootState): number => state.forum.totalPages;
export const selectForumTotalPosts = (state: SharedRootState): number => state.forum.totalPosts;