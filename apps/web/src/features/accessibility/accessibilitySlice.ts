import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store/initStore';

// Local storage key for screen reader preference
const SCREEN_READER_STORAGE_KEY = 'neurolink-screen-reader-enabled';

// Get initial screen reader state from localStorage
const getInitialScreenReaderState = (): boolean => {
  if (typeof window !== 'undefined') {
    const savedPreference = localStorage.getItem(SCREEN_READER_STORAGE_KEY);
    return savedPreference === 'true';
  }
  return false;
};

interface AccessibilityState {
  screenReaderEnabled: boolean;
  isSpeaking: boolean;
}

const initialState: AccessibilityState = {
  screenReaderEnabled: getInitialScreenReaderState(),
  isSpeaking: false,
};

export const accessibilitySlice = createSlice({
  name: 'accessibility',
  initialState,
  reducers: {
    toggleScreenReader: (state) => {
      state.screenReaderEnabled = !state.screenReaderEnabled;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(SCREEN_READER_STORAGE_KEY, state.screenReaderEnabled.toString());
      }
    },
    setScreenReaderEnabled: (state, action: PayloadAction<boolean>) => {
      state.screenReaderEnabled = action.payload;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(SCREEN_READER_STORAGE_KEY, state.screenReaderEnabled.toString());
      }
    },
    setIsSpeaking: (state, action: PayloadAction<boolean>) => {
      state.isSpeaking = action.payload;
    },
  },
});

// Export actions and reducer
export const { toggleScreenReader, setScreenReaderEnabled, setIsSpeaking } = accessibilitySlice.actions;
export default accessibilitySlice.reducer;

// Selectors - Use the web app's RootState
export const selectScreenReaderEnabled = (state: RootState) => state.accessibility.screenReaderEnabled; // Direct access
export const selectIsSpeaking = (state: RootState) => state.accessibility.isSpeaking; // Direct access 