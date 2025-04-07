import { createSlice } from '@reduxjs/toolkit';
// Initial state
const initialState = {
    connectionStatus: 'idle',
    userId: null,
    totalUnreadCount: 0,
    error: null,
};
// Create the slice
const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // Action when starting connection attempt
        setChatConnecting(state) {
            state.connectionStatus = 'connecting';
            state.userId = null;
            state.totalUnreadCount = 0; // Reset unread count on reconnect attempt
            state.error = null;
        },
        // Action when connection is successful
        setChatConnected(state, action) {
            state.connectionStatus = 'connected';
            state.userId = action.payload.userId;
            state.error = null; // Clear previous errors
        },
        // Action when disconnected (gracefully or unexpectedly)
        setChatDisconnected(state, action) {
            state.connectionStatus = 'disconnected';
            state.userId = null;
            // Resetting unread count on disconnect for simplicity in this example
            state.totalUnreadCount = 0;
            state.error = action.payload?.error || 'Connection closed.';
        },
        // Action for initialization or connection errors
        setChatError(state, action) {
            state.connectionStatus = 'error';
            state.error = action.payload.error;
            state.userId = null; // Ensure user ID is cleared on error
            state.totalUnreadCount = 0; // Reset unread count on error
        },
        // Action to update the total unread message count
        setTotalUnreadCount(state, action) {
            // Ensure count is non-negative
            state.totalUnreadCount = Math.max(0, action.payload);
        },
    },
});
// Export actions
export const { setChatConnecting, setChatConnected, setChatDisconnected, setChatError, setTotalUnreadCount, } = chatSlice.actions;
// Export reducer
export default chatSlice.reducer;
// Selectors (using SharedRootState for type safety)
export const selectChatConnectionStatus = (state) => state.chat.connectionStatus;
export const selectTotalUnreadCount = (state) => state.chat.totalUnreadCount;
export const selectChatUserId = (state) => state.chat.userId;
export const selectChatError = (state) => state.chat.error;
