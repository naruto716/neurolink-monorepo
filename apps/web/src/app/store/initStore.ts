import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
// Import individual shared reducers and their state types
import { 
    TokensState, 
    UserState, 
    PaginatedUsersState, // Renamed from SuggestedUsersState
    tokensReducer, 
    userReducer, 
    paginatedUsersReducer // Renamed from suggestedUsersReducer
} from '@neurolink/shared'; 
import themeReducer, { ThemeState } from '../../features/theme/themeSlice'; 
import accessibilityReducer, { AccessibilityState } from '../../features/accessibility/accessibilitySlice'; 

// Combine web-specific reducers with the shared reducers explicitly
const webRootReducer = combineReducers({
  // Shared reducers
  tokens: tokensReducer,
  user: userReducer,
  paginatedUsers: paginatedUsersReducer, // Use the correct name
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
