// packages/shared/src/features/forum/forumSlice.ts
import { createSlice, createAsyncThunk, PayloadAction, AsyncThunk } from '@reduxjs/toolkit'; // Import AsyncThunk
import { AxiosInstance } from 'axios';
import {
  PostResponseDTO, // Renamed from ForumPostDTO
  PaginatedForumPostsResponseDTO,
  FetchForumPostsParams,
  PostCreateDTO,
  TagResponseDTO,
  PaginatedTagsResponseDTO,
  FetchTagsParams,
  PostDetailResponseDTO, // Add detail DTO
  CommentCreateDTO, // Add comment DTOs
  CommentResponseDTO,
  PaginatedCommentsResponseDTO,
  FetchCommentsParams,
  LikeResponse, // Add comment params
} from './types';
import {
  fetchForumPosts as fetchForumPostsAPI,
  createPost as createPostAPI,
  // fetchTags as fetchTagsAPI, // Remove old alias
  fetchPostById as fetchPostByIdAPI,
  fetchCommentsForPost as fetchCommentsAPI,
  createCommentForPost as createCommentAPI,
  // Removed duplicate alias
  fetchForumTags as fetchForumTagsAPI, // Use renamed API function
  likePost as likePostAPI, // Add likePost API import
} from './forumAPI';
import { SharedRootState } from '../../app/store/store'; // Assuming SharedRootState path

// Define the shape of the forum state
export interface ForumState { // Export the interface
  posts: PostResponseDTO[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalPosts: number;
  // State for tags
  tags: TagResponseDTO[];
  tagsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  tagsError: string | null;
  tagsCurrentPage: number;
  tagsTotalPages: number;
  tagsTotalTags: number;
  // State for post creation
  createPostStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  createPostError: string | null;
  // State for selected post detail
  selectedPost: PostDetailResponseDTO | null;
  selectedPostStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  selectedPostError: string | null; // Missing comma here
  // State for comments
  comments: CommentResponseDTO[];
  commentsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  commentsError: string | null;
  commentsCurrentPage: number; // Missing comma here
  commentsTotalPages: number;
  commentsTotalComments: number; // Missing comma here
  // State for comment creation
  createCommentStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  createCommentError: string | null;
  // State for liking a post
  likeStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  likeError: string | null;
}

// Initial state
const initialState: ForumState = {
  posts: [],
  status: 'idle',
  error: null,
  currentPage: 0,
  totalPages: 0,
  totalPosts: 0,
  // Tags initial state
  tags: [],
  tagsStatus: 'idle',
  tagsError: null,
  tagsCurrentPage: 0,
  tagsTotalPages: 0,
  tagsTotalTags: 0,
  // Create post initial state
  createPostStatus: 'idle',
  createPostError: null,
  // Selected Post Detail State
  selectedPost: null as PostDetailResponseDTO | null,
  selectedPostStatus: 'idle', // Correct initial value
  selectedPostError: null as string | null,
  // Comments State
  comments: [] as CommentResponseDTO[],
  commentsStatus: 'idle', // Correct initial value
  commentsError: null as string | null,
  commentsCurrentPage: 0,
  commentsTotalPages: 0,
  commentsTotalComments: 0,
  // Create Comment State
  createCommentStatus: 'idle', // Correct initial value
  createCommentError: null as string | null,
  // Like Post initial state
  likeStatus: 'idle',
  likeError: null,
};

// Define the type for the async thunk arguments to access meta.arg correctly
type FetchForumPostsThunkArg = { apiClient: AxiosInstance; params?: FetchForumPostsParams };

// Async thunk for fetching forum posts
export const fetchForumPosts = createAsyncThunk<
  PaginatedForumPostsResponseDTO,
  FetchForumPostsThunkArg,
  { rejectValue: string; state: SharedRootState } // Added state type
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

// Define the type for the createPost async thunk arguments
type CreatePostThunkArg = { apiClient: AxiosInstance; postData: PostCreateDTO };

// Async thunk for creating a forum post
export const createPost = createAsyncThunk<
  PostResponseDTO,
  CreatePostThunkArg,
  { rejectValue: string; state: SharedRootState }
>(
  'forum/createPost',
  async ({ apiClient, postData }, { rejectWithValue }) => {
    try {
      const response = await createPostAPI(apiClient, postData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create post';
      return rejectWithValue(message);
    }
  }
);

// --- Fetch Post By ID Thunk ---
type FetchPostByIdThunkArg = { apiClient: AxiosInstance; postId: string };

export const fetchPostById = createAsyncThunk<
  PostDetailResponseDTO,
  FetchPostByIdThunkArg,
  { rejectValue: string; state: SharedRootState }
>(
  'forum/fetchPostById',
  async ({ apiClient, postId }, { rejectWithValue }) => {
    try {
      const response = await fetchPostByIdAPI(apiClient, postId);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch post details';
      return rejectWithValue(message);
    }
  }
);

// --- Fetch Comments Thunk ---
type FetchCommentsThunkArg = { apiClient: AxiosInstance; postId: string; params?: FetchCommentsParams };

export const fetchComments = createAsyncThunk<
  PaginatedCommentsResponseDTO,
  FetchCommentsThunkArg,
  { rejectValue: string; state: SharedRootState }
>(
  'forum/fetchComments',
  async ({ apiClient, postId, params }, { rejectWithValue }) => {
    try {
      const response = await fetchCommentsAPI(apiClient, postId, params);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch comments';
      return rejectWithValue(message);
    }
  }
);

// --- Create Comment Thunk ---
type CreateCommentThunkArg = { apiClient: AxiosInstance; postId: string; commentData: CommentCreateDTO };

export const createComment = createAsyncThunk<
  CommentResponseDTO,
  CreateCommentThunkArg,
  { rejectValue: string; state: SharedRootState }
>(
  'forum/createComment',
  async ({ apiClient, postId, commentData }, { rejectWithValue }) => {
    try {
      const response = await createCommentAPI(apiClient, postId, commentData);
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create comment';
      return rejectWithValue(message);
    }
  }
);

// --- Like Post Thunk ---
type LikePostThunkArg = { apiClient: AxiosInstance; postId: string };

export const likePost = createAsyncThunk<
  LikeResponse, // Return type from API
  LikePostThunkArg,
  { rejectValue: string; state: SharedRootState }
>(
  'forum/likePost',
  async ({ apiClient, postId }, { rejectWithValue }) => {
    try {
      const response = await likePostAPI(apiClient, postId);
      return response; // Contains { message: string }
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to like post';
      return rejectWithValue(message);
    }
  }
);

// Define the type for the fetchTags async thunk arguments
type FetchTagsThunkArg = { apiClient: AxiosInstance; params?: FetchTagsParams };

// Async thunk for fetching tags
export const fetchForumTags = createAsyncThunk< // Rename thunk
  PaginatedTagsResponseDTO,
  FetchTagsThunkArg,
  { rejectValue: string; state: SharedRootState }
>(
  'forum/fetchForumTags', // Rename action type
  async ({ apiClient, params }, { rejectWithValue }) => {
    try {
      const response = await fetchForumTagsAPI(apiClient, params); // Use renamed API alias
      return response;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to fetch tags';
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
    clearSelectedPost: (state) => {
        state.selectedPost = null;
        state.selectedPostStatus = 'idle';
        state.selectedPostError = null;
        state.comments = [];
        state.commentsStatus = 'idle';
        state.commentsError = null;
        state.commentsCurrentPage = 0;
        state.commentsTotalPages = 0;
        state.commentsTotalComments = 0;
    },
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
      })
      // Create Post Reducers
      .addCase(createPost.pending, (state) => {
        state.createPostStatus = 'loading';
        state.createPostError = null;
      })
      .addCase(createPost.fulfilled, (state, action: PayloadAction<PostResponseDTO>) => {
        state.createPostStatus = 'succeeded';
        // Add the new post to the beginning of the list for immediate visibility
        // Note: This assumes the list is sorted by creation date descending.
        // If not, a refetch might be more appropriate after creation.
        state.posts.unshift(action.payload);
        state.totalPosts += 1; // Increment total posts count
        // Optionally reset pagination if needed, or trigger a refetch of page 1
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createPostStatus = 'failed';
        state.createPostError = action.payload ?? 'Unknown error creating post';
      })
      // Fetch Forum Tags Reducers
      .addCase(fetchForumTags.pending, (state) => { // Use renamed thunk
        state.tagsStatus = 'loading';
        state.tagsError = null;
      })
      .addCase(fetchForumTags.fulfilled, ( // Use renamed thunk
        state,
        action: PayloadAction<PaginatedTagsResponseDTO, string, { arg: FetchTagsThunkArg }>
      ) => {
        state.tagsStatus = 'succeeded';
        const requestedPage = action.meta.arg.params?.page;
        const isPaginating = requestedPage && requestedPage > 1;

        if (isPaginating) {
           state.tags = [...state.tags, ...action.payload.tags];
        } else {
           state.tags = action.payload.tags;
        }
        state.tagsCurrentPage = requestedPage || 1;
        state.tagsTotalPages = action.payload.total_pages;
        state.tagsTotalTags = action.payload.total_tags;
        state.tagsError = null;
      })
      .addCase(fetchForumTags.rejected, (state, action) => { // Use renamed thunk
        state.tagsStatus = 'failed';
        state.tagsError = action.payload ?? 'Unknown error fetching tags';
      })
      // Fetch Post By ID Reducers
      .addCase(fetchPostById.pending, (state) => {
        state.selectedPostStatus = 'loading';
        state.selectedPostError = null;
      })
      .addCase(fetchPostById.fulfilled, (state, action: PayloadAction<PostDetailResponseDTO>) => {
        state.selectedPostStatus = 'succeeded';
        state.selectedPost = action.payload;
        // Comments might be included in the payload based on API, or fetched separately
        // If included, initialize comments state here
        if (action.payload.comments) {
            state.comments = action.payload.comments;
            // Assuming initial load doesn't use pagination params from this endpoint
            state.commentsCurrentPage = 1;
            // We might not get total pages/comments from this endpoint, fetchComments handles pagination
            state.commentsTotalComments = action.payload.comments.length; // Or use comments_count if available and accurate
            state.commentsStatus = 'succeeded'; // Mark comments as loaded if included
        } else {
            // If comments are not included, reset comment state or trigger fetchComments
            state.comments = [];
            state.commentsStatus = 'idle';
            state.commentsCurrentPage = 0;
            state.commentsTotalPages = 0;
            state.commentsTotalComments = 0;
        }
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.selectedPostStatus = 'failed';
        state.selectedPostError = action.payload ?? 'Unknown error fetching post details';
      })
      // Fetch Comments Reducers
      .addCase(fetchComments.pending, (state) => {
        state.commentsStatus = 'loading';
        state.commentsError = null;
      })
      .addCase(fetchComments.fulfilled, (
        state,
        action: PayloadAction<PaginatedCommentsResponseDTO, string, { arg: FetchCommentsThunkArg }>
      ) => {
        state.commentsStatus = 'succeeded';
        const requestedPage = action.meta.arg.params?.page;
        const isPaginating = requestedPage && requestedPage > 1;

        if (isPaginating) {
           state.comments = [...state.comments, ...action.payload.comments];
        } else {
           state.comments = action.payload.comments;
        }
        state.commentsCurrentPage = requestedPage || 1;
        state.commentsTotalPages = action.payload.total_pages;
        state.commentsTotalComments = action.payload.total_comments;
        state.commentsError = null;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.commentsStatus = 'failed';
        state.commentsError = action.payload ?? 'Unknown error fetching comments';
      })
      // Create Comment Reducers
      .addCase(createComment.pending, (state) => {
        state.createCommentStatus = 'loading';
        state.createCommentError = null;
      })
      .addCase(createComment.fulfilled, (state, action: PayloadAction<CommentResponseDTO>) => {
        state.createCommentStatus = 'succeeded';
        // Add the new comment to the list (e.g., at the end or beginning)
        state.comments.push(action.payload);
        state.commentsTotalComments += 1;
        // Optionally adjust total pages if needed, though usually not necessary for adding one item
        if (state.selectedPost) {
            state.selectedPost.comments_count += 1; // Update count on the post object too
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.createCommentStatus = 'failed';
        state.createCommentError = action.payload ?? 'Unknown error creating comment';
      })
      // Like Post Reducers
      .addCase(likePost.pending, (state) => {
        state.likeStatus = 'loading';
        state.likeError = null;
      })
      .addCase(likePost.fulfilled, (state, action) => {
        state.likeStatus = 'succeeded';
        // Increment the like count on the selected post if it exists
        if (state.selectedPost && state.selectedPost.id === action.meta.arg.postId) {
          state.selectedPost.likes += 1;
        }
        // Also update the like count in the main posts list if the post exists there
        const postIndex = state.posts.findIndex(p => p.id === action.meta.arg.postId);
        if (postIndex !== -1) {
            state.posts[postIndex].likes += 1;
        }
      })
      .addCase(likePost.rejected, (state, action) => {
        state.likeStatus = 'failed';
        state.likeError = action.payload ?? 'Unknown error liking post';
      });
  },
});

// Export actions and reducer
export const { resetForumState, clearSelectedPost } = forumSlice.actions;
export default forumSlice.reducer;

// Selectors for Posts
export const selectForumPosts = (state: SharedRootState): PostResponseDTO[] => state.forum.posts;
export const selectForumStatus = (state: SharedRootState): ForumState['status'] => state.forum.status;
export const selectForumError = (state: SharedRootState): string | null => state.forum.error;
export const selectForumCurrentPage = (state: SharedRootState): number => state.forum.currentPage;
export const selectForumTotalPages = (state: SharedRootState): number => state.forum.totalPages;
export const selectForumTotalPosts = (state: SharedRootState): number => state.forum.totalPosts;

// Selectors for Tags
export const selectForumTags = (state: SharedRootState): TagResponseDTO[] => state.forum.tags;
export const selectForumTagsStatus = (state: SharedRootState): ForumState['tagsStatus'] => state.forum.tagsStatus;
export const selectForumTagsError = (state: SharedRootState): string | null => state.forum.tagsError;
export const selectForumTagsCurrentPage = (state: SharedRootState): number => state.forum.tagsCurrentPage;
export const selectForumTagsTotalPages = (state: SharedRootState): number => state.forum.tagsTotalPages;
export const selectForumTagsTotalTags = (state: SharedRootState): number => state.forum.tagsTotalTags;

// Selectors for Create Post Status
export const selectCreatePostStatus = (state: SharedRootState): ForumState['createPostStatus'] => state.forum.createPostStatus;
export const selectCreatePostError = (state: SharedRootState): string | null => state.forum.createPostError;

// Selectors for Selected Post
export const selectSelectedPost = (state: SharedRootState): PostDetailResponseDTO | null => state.forum.selectedPost;
export const selectSelectedPostStatus = (state: SharedRootState): ForumState['selectedPostStatus'] => state.forum.selectedPostStatus;
export const selectSelectedPostError = (state: SharedRootState): string | null => state.forum.selectedPostError;

// Selectors for Comments
export const selectPostComments = (state: SharedRootState): CommentResponseDTO[] => state.forum.comments;
export const selectCommentsStatus = (state: SharedRootState): ForumState['commentsStatus'] => state.forum.commentsStatus;
export const selectCommentsError = (state: SharedRootState): string | null => state.forum.commentsError;
export const selectCommentsCurrentPage = (state: SharedRootState): number => state.forum.commentsCurrentPage;
export const selectCommentsTotalPages = (state: SharedRootState): number => state.forum.commentsTotalPages;
export const selectCommentsTotalComments = (state: SharedRootState): number => state.forum.commentsTotalComments;

// Selectors for Create Comment Status
export const selectCreateCommentStatus = (state: SharedRootState): ForumState['createCommentStatus'] => state.forum.createCommentStatus;
export const selectCreateCommentError = (state: SharedRootState): string | null => state.forum.createCommentError;

// Selectors for Like Post Status
export const selectLikeStatus = (state: SharedRootState): ForumState['likeStatus'] => state.forum.likeStatus;
export const selectLikeError = (state: SharedRootState): string | null => state.forum.likeError;