import React, { createContext, useContext, useState, useEffect, useMemo, PropsWithChildren } from 'react';
import { PaletteMode, ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';

// Create a context for the theme
type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
  setMode: (mode: PaletteMode) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  setMode: () => {},
});

// Custom hook to use the theme context
export const useThemeContext = () => useContext(ThemeContext);

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = 'neurolink-theme-mode';

export const AppThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const getInitialMode = (): PaletteMode => {
    // Try to get from localStorage
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as PaletteMode | null;
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      return savedMode;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light
    return 'light';
  };

  const [mode, setMode] = useState<PaletteMode>(getInitialMode);
  
  // Create a memoized theme based on the current mode
  const theme = useMemo(() => getTheme(mode), [mode]);
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}; 