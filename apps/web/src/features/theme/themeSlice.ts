import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PaletteMode } from '@mui/material';
import { RootState } from '../../app/store/initStore';

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = 'neurolink-theme-mode';

// Initialize theme from localStorage or system preference
const getInitialMode = (): PaletteMode => {
  // Try to get from localStorage
  if (typeof window !== 'undefined') {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as PaletteMode | null;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      return savedMode;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  
  // Default to light
  return 'light';
};

interface ThemeState {
  mode: PaletteMode;
}

const initialState: ThemeState = {
  mode: getInitialMode(),
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, state.mode);
      }
    },
    setThemeMode: (state, action: PayloadAction<PaletteMode>) => {
      state.mode = action.payload;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, state.mode);
      }
    },
  },
});

// Export actions and reducer
export const { toggleTheme, setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;

// Selectors - Use the web app's RootState
export const selectThemeMode = (state: RootState) => state.theme.mode; // Direct access 