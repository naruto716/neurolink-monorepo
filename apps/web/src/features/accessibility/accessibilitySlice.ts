import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store/initStore';

// Define and export the state interface
export interface AccessibilityState {
  screenReaderEnabled: boolean;
  isSpeaking: boolean;
  fontSize: number; // Example: store font size preference
}

// Initial state
const initialState: AccessibilityState = {
  screenReaderEnabled: false,
  isSpeaking: false,
  fontSize: 16, // Default font size
};

export const accessibilitySlice = createSlice({
  name: 'accessibility',
  initialState,
  reducers: {
    toggleScreenReader: (state) => {
      state.screenReaderEnabled = !state.screenReaderEnabled;
    },
    setIsSpeaking: (state, action: PayloadAction<boolean>) => {
      state.isSpeaking = action.payload;
    },
    setFontSize: (state, action: PayloadAction<number>) => {
      // Add validation if needed (e.g., min/max font size)
      state.fontSize = action.payload;
    },
    increaseFontSize: (state) => {
      // Example logic: increase font size by 2, up to a max
      state.fontSize = Math.min(state.fontSize + 2, 24); 
    },
    decreaseFontSize: (state) => {
      // Example logic: decrease font size by 2, down to a min
      state.fontSize = Math.max(state.fontSize - 2, 12); 
    },
  },
});

// Export actions and reducer
export const { 
  toggleScreenReader, 
  setIsSpeaking,
  setFontSize,
  increaseFontSize,
  decreaseFontSize
} = accessibilitySlice.actions;

export default accessibilitySlice.reducer;

// Selectors - Use the web app's RootState
export const selectScreenReaderEnabled = (state: RootState) => state.accessibility.screenReaderEnabled;
export const selectIsSpeaking = (state: RootState) => state.accessibility.isSpeaking;
export const selectFontSize = (state: RootState) => state.accessibility.fontSize;
