import { configureStore, combineReducers } from '@reduxjs/toolkit';
import tokensReducer from '../../features/tokens/tokensSlice';
import userReducer from '../../features/user/userSlice';
// Import the renamed slice and its state type correctly
import paginatedUsersReducer from '../../features/user/paginatedUsersSlice';
import feedPostsReducer from '../../features/posts/feedPostsSlice'; // Import the new feed posts slice
// Export individual reducers for apps to combine
export const sharedReducers = {
    tokens: tokensReducer,
    user: userReducer,
    paginatedUsers: paginatedUsersReducer,
    feedPosts: feedPostsReducer, // Add the feed posts reducer
};
// Combine reducers *only* for defining the SharedRootState type and example store
const rootReducer = combineReducers(sharedReducers);
// Note: This store configuration is primarily for type inference.
// Individual apps (web, mobile) should import `sharedReducers`
// and combine them with their own app-specific reducers.
// Example store for type inference
const exampleStore = configureStore({
    reducer: rootReducer,
});
