import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// Import individual shared reducers and their state types
import {
  feedPostsReducer, // Import the new feed posts reducer
  paginatedUsersReducer, // Renamed from SuggestedUsersState
  forumReducer, // Import forum reducer
  tokensReducer,
  userReducer,
  chatReducer // Import chat reducer
} from '@neurolink/shared';
import accessibilityReducer from '../../features/accessibility/accessibilitySlice';
import themeReducer from '../../features/theme/themeSlice';

// Combine web-specific reducers with the shared reducers explicitly
const webRootReducer = combineReducers({
  // Shared reducers
  tokens: tokensReducer,
  user: userReducer,
  paginatedUsers: paginatedUsersReducer, // Use the correct name
  feedPosts: feedPostsReducer, // Add the feed posts reducer
  forum: forumReducer, // Add forum reducer
  chat: chatReducer, // Add chat reducer
  // Web-specific reducers
  theme: themeReducer,
  accessibility: accessibilityReducer,
});

// Configure the store for the web application
export const store = configureStore({
  reducer: webRootReducer,
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` directly from the store
export type RootState = ReturnType<typeof store.getState>;

// Define AppDispatch type
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
