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
export * from './features/user/userAPI';
export * from './features/posts/postsAPI'; // Export Post API functions
export * from './features/forum/forumAPI'; // Export Forum API functions
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
    fetchForumPosts,
    resetForumState,
    selectForumPosts,
    selectForumStatus,
    selectForumError,
    selectForumCurrentPage,
    selectForumTotalPages,
    selectForumTotalPosts
} from './features/forum/forumSlice';

// Export other shared utilities or components if any
// export * from './utils/helpers';
