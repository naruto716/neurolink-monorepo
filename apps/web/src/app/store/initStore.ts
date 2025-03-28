import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import shared reducers - Adjust path if necessary
// If '@neurolink/shared' doesn't work, try relative path like '../../../../packages/shared/src'
// Ensure the shared package exports these correctly (check shared/package.json and index.ts/store.ts)
import { sharedReducers } from '@neurolink/shared';

// Import local reducers
import themeReducer from '../../features/theme/themeSlice';
import accessibilityReducer from '../../features/accessibility/accessibilitySlice';

// Combine local reducers
const localReducers = {
  theme: themeReducer,
  accessibility: accessibilityReducer,
};

// Combine shared and local reducers into the root reducer for the web app
const rootReducer = combineReducers({
  ...sharedReducers, // Includes 'tokens' and 'user' from shared package
  ...localReducers, // Includes 'theme' and 'accessibility' from web app
});

// Configure the single store for the web application
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['user/fetchUser/rejected'],
      },
      // Removed thunk extraArgument to avoid circular dependency
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Define the RootState type for the entire web application state
export type RootState = ReturnType<typeof store.getState>;

// Define the AppDispatch type
export type AppDispatch = typeof store.dispatch;

// Export typed hooks for convenience within the web app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Ensure RootState includes the shapes from both shared and local states
// This assertion helps TypeScript understand the combined shape.
// Note: This isn't strictly necessary if RootState is derived correctly,
// but can be useful for clarity or complex scenarios.
// Example check (won't run, just for TS):
// const _checkState: RootState extends SharedRootState & ReturnType<typeof combineReducers< typeof localReducers >> ? true : false = true;

// Function to dynamically inject reducers IF needed (often not necessary with upfront combination)
// export const injectReducer = (key: keyof RootState, reducer: Reducer) => { ... };
// Note: Dynamic injection becomes more complex with pre-combined reducers.
// Consider if you truly need it or if combining upfront is sufficient. 