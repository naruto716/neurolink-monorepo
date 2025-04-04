import userReducer, { 
  fetchUser,
  clearUser,
  setOnboardingStatus,
  selectNeedsOnboarding,
  selectCurrentUser,
  selectUserLoadingStatus
} from './userSlice';

import { User, UserState, Tag, UserPreferences } from './types';
import { fetchUserByUsername } from './userAPI'; // Import the new function

// Export everything from the user module
export {
  // Reducer
  userReducer,
  
  // Actions and thunks
  fetchUser,
  clearUser,
  setOnboardingStatus,
  
  // Selectors
  selectNeedsOnboarding,
  selectCurrentUser,
  selectUserLoadingStatus,
  
  // API Functions
  fetchUserByUsername, // Add the new function here
  
  // Types
  User,
  UserState,
  Tag,
  UserPreferences
};
