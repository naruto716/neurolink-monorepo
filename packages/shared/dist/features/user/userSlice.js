import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCurrentUser } from './userAPI';
// Initial state
const initialState = {
    currentUser: null,
    status: 'idle',
    error: null,
    isOnboarded: false
};
// Async thunks
export const fetchUser = createAsyncThunk('user/fetchUser', async ({ apiClient }, { rejectWithValue }) => {
    try {
        const user = await fetchCurrentUser(apiClient);
        return user;
    }
    catch (error) {
        return rejectWithValue(error.message || 'Failed to fetch user');
    }
});
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
        setOnboardingStatus: (state, action) => {
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
            let errorMessage;
            if (action.payload) {
                errorMessage = String(action.payload);
            }
            else if (action.error.message) {
                errorMessage = action.error.message;
            }
            else {
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
export const selectNeedsOnboarding = (state) => state.user?.isOnboarded === false;
export const selectCurrentUser = (state) => state.user?.currentUser;
export const selectUserLoadingStatus = (state) => state.user?.status || 'idle';
export default userSlice.reducer;
