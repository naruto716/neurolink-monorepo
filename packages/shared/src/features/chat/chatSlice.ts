import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SharedRootState, SharedStateSelector } from '../../app/store/store'; // Use shared types

// Define connection status type
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

// Define the state structure
export interface ChatState {
  connectionStatus: ConnectionStatus;
  userId: string | null; // Store the connected GetStream user ID
  totalUnreadCount: number;
  error: string | null; // Store connection/initialization errors
}

// Initial state
const initialState: ChatState = {
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
    setChatConnected(state, action: PayloadAction<{ userId: string }>) {
      state.connectionStatus = 'connected';
      state.userId = action.payload.userId;
      state.error = null; // Clear previous errors
    },
    // Action when disconnected (gracefully or unexpectedly)
    setChatDisconnected(state, action: PayloadAction<{ error?: string } | undefined>) {
      state.connectionStatus = 'disconnected';
      state.userId = null;
      // Resetting unread count on disconnect for simplicity in this example
      state.totalUnreadCount = 0;
      state.error = action.payload?.error || 'Connection closed.';
    },
    // Action for initialization or connection errors
    setChatError(state, action: PayloadAction<{ error: string }>) {
        state.connectionStatus = 'error';
        state.error = action.payload.error;
        state.userId = null; // Ensure user ID is cleared on error
        state.totalUnreadCount = 0; // Reset unread count on error
    },
    // Action to update the total unread message count
    setTotalUnreadCount(state, action: PayloadAction<number>) {
      // Ensure count is non-negative
      state.totalUnreadCount = Math.max(0, action.payload);
    },
  },
});

// Export actions
export const {
  setChatConnecting,
  setChatConnected,
  setChatDisconnected,
  setChatError,
  setTotalUnreadCount,
} = chatSlice.actions;

// Export reducer
export default chatSlice.reducer;

// Selectors (using SharedRootState for type safety)
export const selectChatConnectionStatus: SharedStateSelector<ConnectionStatus> = (state: SharedRootState) => state.chat.connectionStatus;
export const selectTotalUnreadCount: SharedStateSelector<number> = (state: SharedRootState) => state.chat.totalUnreadCount;
export const selectChatUserId: SharedStateSelector<string | null> = (state: SharedRootState) => state.chat.userId;
export const selectChatError: SharedStateSelector<string | null> = (state: SharedRootState) => state.chat.error;
