import { useCallback } from 'react';
import { PaletteMode } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@neurolink/shared';
import { selectThemeMode, toggleTheme, setThemeMode } from './themeSlice';
import { getTheme } from '../../app/layout/theme';

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(selectThemeMode);
  
  const handleToggleTheme = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);
  
  const handleSetThemeMode = useCallback((newMode: PaletteMode) => {
    dispatch(setThemeMode(newMode));
  }, [dispatch]);
  
  // Get the MUI theme object based on current mode
  const theme = getTheme(mode);
  
  return {
    mode,
    theme,
    toggleTheme: handleToggleTheme,
    setMode: handleSetThemeMode
  };
}; 