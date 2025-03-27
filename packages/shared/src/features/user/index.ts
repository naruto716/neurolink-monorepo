import userReducer, { 
  fetchUser,
  clearUser,
  setOnboardingStatus,
  selectNeedsOnboarding,
  selectCurrentUser,
  selectUserLoadingStatus
} from './userSlice';

import { User, UserState, Tag, UserPreferences } from './types';

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
  
  // Types
  User,
  UserState,
  Tag,
  UserPreferences
}; 