// Export API configuration and client creation
export * from './app/api/config';
export * from './app/api/api'; // Assuming createApiClient is here

// Export Store related types and reducers
export * from './app/store/store'; // Exports SharedRootState, SharedStateSelector, sharedReducers
export { default as tokensReducer } from './features/tokens/tokensSlice';
export { default as userReducer } from './features/user/userSlice';
export { default as paginatedUsersReducer } from './features/user/paginatedUsersSlice';
export { default as feedPostsReducer } from './features/posts/feedPostsSlice'; // Export new reducer
export { default as chatReducer } from './features/chat/chatSlice'; // Export chat reducer
export { default as forumReducer } from './features/forum/forumSlice'; // Export forum reducer
export type { TokensState } from './features/tokens/tokensSlice';
export type { UserState } from './features/user/types';
export type { PaginatedUsersState } from './features/user/paginatedUsersSlice';
export type { FeedPostsState } from './features/posts/feedPostsSlice'; // Export new state type
export type { ChatState, ConnectionStatus } from './features/chat/chatSlice'; // Export chat state type
export type { ForumState } from './features/forum/forumSlice'; // Export forum state type

// Export Feature specific types and API functions
// Make sure to export ALL necessary types from types.ts
export type { Tag, UserPreferences, User, UserProfileInput, ListedUser, PaginatedUsersResponse, Connection, PaginatedConnectionsResponse } from './features/user/types';
export * from './features/posts/types'; // Re-export all types from posts/types.ts
export * from './features/commitments/types'; // Export commitment types
export * from './features/forum/types'; // Export forum types
// Explicitly export types needed for CreatePostPage that might not be covered by '*'
export type { PostCreateDTO, TagResponseDTO } from './features/forum/types';
// Explicitly export Commitment and Invitation related types
export type {
    Commitment,
    CommitmentParticipant,
    PaginatedCommitmentsResponse,
    ReceivedInvitation,
    ReceivedInvitationCommitment,
    PaginatedReceivedInvitationsResponse,
    PaginatedSentInvitationsResponse
} from './features/commitments/types';
// Explicitly export required functions from userAPI, excluding fetchTags/FetchTagsParams to avoid conflict
export {
    fetchCurrentUser,
    createUser,
    fetchUserByUsername,
    uploadProfilePicture,
    fetchUsers,
    fetchUserFriends,
    fetchUserFriendCount,
    fetchPendingRequests,
    acceptFriendRequest,
    declineFriendRequest,
    sendFriendRequest,
    fetchConnectionStatus,
    fetchSentRequests,
    fetchUserCommitments,
    fetchCommitmentById,
    fetchSentInvitations,
    fetchSentInvitationsDetail,
    fetchReceivedInvitations,
    respondToCommitmentInvitation,
    fetchPendingInvitationCount,
    fetchAcceptedCommitmentCount,
    createCommitment,
    fetchUserTags, // Export renamed function
    FetchTagsParams as FetchUserTagsParams // Export and alias the interface
} from './features/user/userAPI';
export * from './features/posts/postsAPI'; // Export Post API functions
// Remove explicit export of forumAPI functions, export thunks from slice instead
// export * from './features/forum/forumAPI'; // Keep this commented or remove
export * from './features/tokens/tokensSlice'; // Export token actions/selectors if needed directly
export * from './features/user/userSlice'; // Export user actions/selectors if needed directly
export * from './features/user/paginatedUsersSlice'; // Export paginated user actions/selectors
export * from './features/posts/feedPostsSlice'; // Export feed post actions/selectors
export * from './features/chat/chatAPI'; // Export chat API explicitly
export * from './features/chat/types'; // Export chat types explicitly
export { // Export chat slice actions and selectors explicitly
    setChatConnecting,
    setChatConnected,
    setChatDisconnected,
    setChatError,
    setTotalUnreadCount,
    selectChatConnectionStatus,
    selectTotalUnreadCount,
    selectChatUserId,
    selectChatError
} from './features/chat/chatSlice';
export { // Export forum slice actions and selectors explicitly
    // Existing
    fetchForumPosts,
    createPost,
    fetchForumTags, // Export the renamed thunk (will rename in slice next)
    resetForumState,
    selectForumPosts,
    selectForumStatus,
    selectForumError,
    selectForumCurrentPage,
    selectForumTotalPages,
    selectForumTotalPosts,
    selectForumTags,
    selectForumTagsStatus,
    selectForumTagsError,
    selectForumTagsCurrentPage,
    selectForumTagsTotalPages,
    selectForumTagsTotalTags,
    selectCreatePostStatus,
    selectCreatePostError,
    // New exports for post detail and comments
    fetchPostById,
    fetchComments,
    createComment,
    likePost, // Add likePost thunk
    clearSelectedPost,
    selectSelectedPost,
    selectSelectedPostStatus,
    selectSelectedPostError,
    selectPostComments,
    selectCommentsStatus,
    selectCommentsError,
    selectCommentsCurrentPage,
    selectCommentsTotalPages,
    selectCommentsTotalComments,
    selectCreateCommentStatus,
    selectCreateCommentError,
    // Add like selectors
    selectLikeStatus,
    selectLikeError
} from './features/forum/forumSlice';

// Export other shared utilities or components if any
// export * from './utils/helpers';
