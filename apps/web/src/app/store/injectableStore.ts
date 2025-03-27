import { store } from '@neurolink/shared';
import { combineReducers } from '@reduxjs/toolkit';
import themeReducer from '../../features/theme/themeSlice';
import accessibilityReducer from '../../features/accessibility/accessibilitySlice';

// The reducers we want to inject
const injectedReducers = {
  theme: themeReducer,
  accessibility: accessibilityReducer
};

// Method to add our reducers
export const injectReducers = () => {
  // Get the existing reducer from the store
  const existingReducer = store.getState();
  
  // Create a new root reducer with both existing and new reducers
  const rootReducer = combineReducers({
    ...existingReducer,
    ...injectedReducers
  });
  
  // Replace the store's reducer with our enhanced version
  store.replaceReducer(rootReducer);
  
  return store;
}; 