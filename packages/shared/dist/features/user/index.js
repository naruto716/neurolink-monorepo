import userReducer, { fetchUser, clearUser, setOnboardingStatus, selectNeedsOnboarding, selectCurrentUser, selectUserLoadingStatus } from './userSlice';
import { fetchUserByUsername } from './userAPI'; // Import the new function
// Export everything from the user module
export { 
// Reducer
userReducer, 
// Actions and thunks
fetchUser, clearUser, setOnboardingStatus, 
// Selectors
selectNeedsOnboarding, selectCurrentUser, selectUserLoadingStatus, 
// API Functions
fetchUserByUsername };
