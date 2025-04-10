// packages/shared/src/features/forum/forumSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'; // Import AsyncThunk
import { fetchForumPosts as fetchForumPostsAPI, createPost as createPostAPI, fetchTags as fetchTagsAPI, fetchPostById as fetchPostByIdAPI, // Add new API imports
fetchCommentsForPost as fetchCommentsAPI, createCommentForPost as createCommentAPI, likePost as likePostAPI, // Add likePost API import
 } from './forumAPI';
// Initial state
const initialState = {
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
    selectedPost: null,
    selectedPostStatus: 'idle', // Correct initial value
    selectedPostError: null,
    // Comments State
    comments: [],
    commentsStatus: 'idle', // Correct initial value
    commentsError: null,
    commentsCurrentPage: 0,
    commentsTotalPages: 0,
    commentsTotalComments: 0,
    // Create Comment State
    createCommentStatus: 'idle', // Correct initial value
    createCommentError: null,
    // Like Post initial state
    likeStatus: 'idle',
    likeError: null,
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
// Async thunk for creating a forum post
export const createPost = createAsyncThunk('forum/createPost', async ({ apiClient, postData }, { rejectWithValue }) => {
    try {
        const response = await createPostAPI(apiClient, postData);
        return response;
    }
    catch (error) {
        const message = error.response?.data?.detail || error.message || 'Failed to create post';
        return rejectWithValue(message);
    }
});
export const fetchPostById = createAsyncThunk('forum/fetchPostById', async ({ apiClient, postId }, { rejectWithValue }) => {
    try {
        const response = await fetchPostByIdAPI(apiClient, postId);
        return response;
    }
    catch (error) {
        const message = error.response?.data?.detail || error.message || 'Failed to fetch post details';
        return rejectWithValue(message);
    }
});
export const fetchComments = createAsyncThunk('forum/fetchComments', async ({ apiClient, postId, params }, { rejectWithValue }) => {
    try {
        const response = await fetchCommentsAPI(apiClient, postId, params);
        return response;
    }
    catch (error) {
        const message = error.response?.data?.detail || error.message || 'Failed to fetch comments';
        return rejectWithValue(message);
    }
});
export const createComment = createAsyncThunk('forum/createComment', async ({ apiClient, postId, commentData }, { rejectWithValue }) => {
    try {
        const response = await createCommentAPI(apiClient, postId, commentData);
        return response;
    }
    catch (error) {
        const message = error.response?.data?.detail || error.message || 'Failed to create comment';
        return rejectWithValue(message);
    }
});
export const likePost = createAsyncThunk('forum/likePost', async ({ apiClient, postId }, { rejectWithValue }) => {
    try {
        const response = await likePostAPI(apiClient, postId);
        return response; // Contains { message: string }
    }
    catch (error) {
        const message = error.response?.data?.detail || error.message || 'Failed to like post';
        return rejectWithValue(message);
    }
});
// Async thunk for fetching tags
export const fetchTags = createAsyncThunk('forum/fetchTags', async ({ apiClient, params }, { rejectWithValue }) => {
    try {
        const response = await fetchTagsAPI(apiClient, params);
        return response;
    }
    catch (error) {
        const message = error.response?.data?.detail || error.message || 'Failed to fetch tags';
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
        })
            // Create Post Reducers
            .addCase(createPost.pending, (state) => {
            state.createPostStatus = 'loading';
            state.createPostError = null;
        })
            .addCase(createPost.fulfilled, (state, action) => {
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
            // Fetch Tags Reducers
            .addCase(fetchTags.pending, (state) => {
            state.tagsStatus = 'loading';
            state.tagsError = null;
        })
            .addCase(fetchTags.fulfilled, (state, action) => {
            state.tagsStatus = 'succeeded';
            const requestedPage = action.meta.arg.params?.page;
            const isPaginating = requestedPage && requestedPage > 1;
            if (isPaginating) {
                state.tags = [...state.tags, ...action.payload.tags];
            }
            else {
                state.tags = action.payload.tags;
            }
            state.tagsCurrentPage = requestedPage || 1;
            state.tagsTotalPages = action.payload.total_pages;
            state.tagsTotalTags = action.payload.total_tags;
            state.tagsError = null;
        })
            .addCase(fetchTags.rejected, (state, action) => {
            state.tagsStatus = 'failed';
            state.tagsError = action.payload ?? 'Unknown error fetching tags';
        })
            // Fetch Post By ID Reducers
            .addCase(fetchPostById.pending, (state) => {
            state.selectedPostStatus = 'loading';
            state.selectedPostError = null;
        })
            .addCase(fetchPostById.fulfilled, (state, action) => {
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
            }
            else {
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
            .addCase(fetchComments.fulfilled, (state, action) => {
            state.commentsStatus = 'succeeded';
            const requestedPage = action.meta.arg.params?.page;
            const isPaginating = requestedPage && requestedPage > 1;
            if (isPaginating) {
                state.comments = [...state.comments, ...action.payload.comments];
            }
            else {
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
            .addCase(createComment.fulfilled, (state, action) => {
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
export const selectForumPosts = (state) => state.forum.posts;
export const selectForumStatus = (state) => state.forum.status;
export const selectForumError = (state) => state.forum.error;
export const selectForumCurrentPage = (state) => state.forum.currentPage;
export const selectForumTotalPages = (state) => state.forum.totalPages;
export const selectForumTotalPosts = (state) => state.forum.totalPosts;
// Selectors for Tags
export const selectForumTags = (state) => state.forum.tags;
export const selectForumTagsStatus = (state) => state.forum.tagsStatus;
export const selectForumTagsError = (state) => state.forum.tagsError;
export const selectForumTagsCurrentPage = (state) => state.forum.tagsCurrentPage;
export const selectForumTagsTotalPages = (state) => state.forum.tagsTotalPages;
export const selectForumTagsTotalTags = (state) => state.forum.tagsTotalTags;
// Selectors for Create Post Status
export const selectCreatePostStatus = (state) => state.forum.createPostStatus;
export const selectCreatePostError = (state) => state.forum.createPostError;
// Selectors for Selected Post
export const selectSelectedPost = (state) => state.forum.selectedPost;
export const selectSelectedPostStatus = (state) => state.forum.selectedPostStatus;
export const selectSelectedPostError = (state) => state.forum.selectedPostError;
// Selectors for Comments
export const selectPostComments = (state) => state.forum.comments;
export const selectCommentsStatus = (state) => state.forum.commentsStatus;
export const selectCommentsError = (state) => state.forum.commentsError;
export const selectCommentsCurrentPage = (state) => state.forum.commentsCurrentPage;
export const selectCommentsTotalPages = (state) => state.forum.commentsTotalPages;
export const selectCommentsTotalComments = (state) => state.forum.commentsTotalComments;
// Selectors for Create Comment Status
export const selectCreateCommentStatus = (state) => state.forum.createCommentStatus;
export const selectCreateCommentError = (state) => state.forum.createCommentError;
// Selectors for Like Post Status
export const selectLikeStatus = (state) => state.forum.likeStatus;
export const selectLikeError = (state) => state.forum.likeError;
