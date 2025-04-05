import { configureStore, combineReducers } from '@reduxjs/toolkit';
import tokensReducer, { TokensState } from '../../features/tokens/tokensSlice';
import userReducer from '../../features/user/userSlice'; 
import { UserState } from '../../features/user/types'; 
// Import the renamed slice and its state type correctly
import paginatedUsersReducer, { PaginatedUsersState } from '../../features/user/paginatedUsersSlice';
import feedPostsReducer, { FeedPostsState } from '../../features/posts/feedPostsSlice'; // Import the new feed posts slice

// Define the shape of the shared root state
export interface SharedRootState {
  tokens: TokensState;
  user: UserState;
  paginatedUsers: PaginatedUsersState; // Use the correct state type name
  feedPosts: FeedPostsState; // Add the feed posts state
}

// Export individual reducers for apps to combine
export const sharedReducers = {
  tokens: tokensReducer,
  user: userReducer,
  paginatedUsers: paginatedUsersReducer,
  feedPosts: feedPostsReducer, // Add the feed posts reducer
};

// Combine reducers *only* for defining the SharedRootState type and example store
const rootReducer = combineReducers(sharedReducers);

// Type for selectors using the shared state
// Use 'any' for the state type to allow flexibility for app-specific root states
export type SharedStateSelector<T> = (state: any) => T; 

// Note: This store configuration is primarily for type inference.
// Individual apps (web, mobile) should import `sharedReducers`
// and combine them with their own app-specific reducers.

// Example store for type inference
const exampleStore = configureStore({
  reducer: rootReducer,
});

export type SharedDispatch = typeof exampleStore.dispatch;
