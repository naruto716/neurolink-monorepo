// Export API configuration and client creation
export * from './app/api/config';
export * from './app/api/api'; // Assuming createApiClient is here

// Export Store related types and reducers
export * from './app/store/store'; // Exports SharedRootState, SharedStateSelector, sharedReducers
export { default as tokensReducer } from './features/tokens/tokensSlice';
export { default as userReducer } from './features/user/userSlice';
export { default as paginatedUsersReducer } from './features/user/paginatedUsersSlice';
export { default as feedPostsReducer } from './features/posts/feedPostsSlice'; // Export new reducer
export type { TokensState } from './features/tokens/tokensSlice';
export type { UserState } from './features/user/types'; 
export type { PaginatedUsersState } from './features/user/paginatedUsersSlice';
export type { FeedPostsState } from './features/posts/feedPostsSlice'; // Export new state type

// Export Feature specific types and API functions
// Make sure to export ALL necessary types from types.ts
export type { Tag, UserPreferences, User, UserProfileInput, ListedUser, PaginatedUsersResponse } from './features/user/types';
export * from './features/posts/types'; // Re-export all types from posts/types.ts
export * from './features/user/userAPI';
export * from './features/posts/postsAPI'; // Export Post API functions
export * from './features/tokens/tokensSlice'; // Export token actions/selectors if needed directly
export * from './features/user/userSlice'; // Export user actions/selectors if needed directly
export * from './features/user/paginatedUsersSlice'; // Export paginated user actions/selectors
export * from './features/posts/feedPostsSlice'; // Export feed post actions/selectors

// Export other shared utilities or components if any
// export * from './utils/helpers';
