import userReducer, { fetchUser, clearUser, setOnboardingStatus, selectNeedsOnboarding, selectCurrentUser, selectUserLoadingStatus } from './userSlice';
import { User, UserState, Tag, UserPreferences } from './types';
import { fetchUserByUsername } from './userAPI';
export { userReducer, fetchUser, clearUser, setOnboardingStatus, selectNeedsOnboarding, selectCurrentUser, selectUserLoadingStatus, fetchUserByUsername, // Add the new function here
User, UserState, Tag, UserPreferences };
