import { createTheme, PaletteMode, ThemeOptions } from '@mui/material';

// Define the common theme settings
const getThemeOptions = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            main: '#3f51b5',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
        }
      : {
          // Dark mode palette
          primary: {
            main: '#5c6bc0',
          },
          secondary: {
            main: '#ff4081',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
        }),
  },
  components: {
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          boxShadow: mode === 'light' 
            ? '0 2px 4px rgba(0,0,0,0.1)' 
            : '0 2px 4px rgba(0,0,0,0.3)',
        },
      },
    },
  },
});

// Create and export the light and dark themes
export const lightTheme = createTheme(getThemeOptions('light'));
export const darkTheme = createTheme(getThemeOptions('dark'));

// Export a function to get a theme by mode
export const getTheme = (mode: PaletteMode) => 
  mode === 'light' ? lightTheme : darkTheme; 