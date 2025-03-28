import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AxiosInstance } from 'axios';
import { User, UserState } from './types';
import { fetchCurrentUser } from './userAPI';
import { SharedRootState, SharedStateSelector } from '../../app/store/store';

// Initial state
const initialState: UserState = {
  currentUser: null,
  status: 'idle',
  error: null,
  isOnboarded: false
};

// Async thunks
export const fetchUser = createAsyncThunk<
  User,
  { apiClient: AxiosInstance },
  { rejectValue: string }
>(
  'user/fetchUser',
  async ({ apiClient }, { rejectWithValue }) => {
    try {
      const user = await fetchCurrentUser(apiClient);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user');
    }
  }
);

// Create the user slice
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: (state) => {
      state.currentUser = null;
      state.isOnboarded = false;
      state.status = 'idle';
      state.error = null;
    },
    setOnboardingStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnboarded = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchUser
      .addCase(fetchUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentUser = action.payload;
        state.isOnboarded = true;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        // Set status to failed
        state.status = 'failed';
        
        // Extract the error message
        let errorMessage: string;
        if (action.payload) {
          errorMessage = String(action.payload);
        } else if (action.error.message) {
          errorMessage = action.error.message;
        } else {
          errorMessage = 'Unknown error';
        }
        
        // Store the error message
        state.error = errorMessage;
        
        // Check if onboarding is needed
        if (errorMessage.includes('needs onboarding') || errorMessage.includes('not found')) {
          state.isOnboarded = false;
        }
      });
  }
});

// Export actions and reducer
export const { clearUser, setOnboardingStatus } = userSlice.actions;

// Selectors - Use SharedStateSelector and explicitly type state
export const selectNeedsOnboarding: SharedStateSelector<boolean> = (state: SharedRootState) =>
  state.user?.isOnboarded === false;

export const selectCurrentUser: SharedStateSelector< User | null > = (state: SharedRootState) =>
  state.user?.currentUser;

export const selectUserLoadingStatus: SharedStateSelector< 'idle' | 'loading' | 'succeeded' | 'failed' > = (state: SharedRootState) =>
  state.user?.status || 'idle';

export default userSlice.reducer; 