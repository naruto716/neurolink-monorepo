import { createTheme, PaletteMode, ThemeOptions, alpha } from '@mui/material'; // Added alpha

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
            default: '#ffffff',
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
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none', // Prevent uppercase transformation
    },
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
    // Add base styles for Card and Paper
    MuiCard: {
      defaultProps: {
        elevation: 0, // Use border instead of shadow by default
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '12px', // Consistent rounded corners
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper, // Ensure paper background
        }),
      },
    },
    // MuiPaper override removed to avoid affecting layout elements like sidebars/appbar
    // Add base styles for Button
    MuiButton: {
      defaultProps: {
        disableElevation: true, // Flat buttons by default
      },
      styleOverrides: {
        root: {
          borderRadius: '8px', // Slightly rounded buttons
          textTransform: 'none', // Already set in typography, but good to ensure
          fontWeight: 600,
          padding: '8px 16px', // Default padding
        },
        containedPrimary: ({ theme }) => ({
          '&:hover': {
            backgroundColor: theme.palette.primary.dark, // Darken on hover
          },
        }),
        outlinedPrimary: ({ theme }) => ({
          borderColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08), // Subtle background on hover using alpha
          },
        }),
      },
    },
    MuiMenu: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(45, 45, 45, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          boxShadow: mode === 'light'
            ? '0 4px 20px rgba(0, 0, 0, 0.08)'
            : '0 4px 20px rgba(0, 0, 0, 0.25)',
          border: mode === 'light'
            ? '1px solid rgba(230, 230, 230, 0.85)' // Keep specific border for menus
            : '1px solid rgba(70, 70, 70, 0.85)',
        },
        list: {
          padding: '16px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          margin: '2px 0',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light'
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(45, 45, 45, 0.85)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          boxShadow: mode === 'light'
            ? '0 4px 20px rgba(0, 0, 0, 0.08)'
            : '0 4px 20px rgba(0, 0, 0, 0.25)',
          border: mode === 'light'
            ? '1px solid rgba(230, 230, 230, 0.85)' // Keep specific border for popovers
            : '1px solid rgba(70, 70, 70, 0.85)',
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
