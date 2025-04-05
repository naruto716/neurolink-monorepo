import { createTheme, PaletteMode, ThemeOptions, alpha } from '@mui/material'; // Added alpha

// Define the common theme settings
const getThemeOptions = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette (Based on SnowUI Bright Light)
          primary: {
            main: '#1c1c1c', // Bright Blue
          },
          secondary: {
            main: '#E3F5FF', // Bright Purple
          },
          background: {
            default: '#ffffff', // White 100%
            paper: '#ffffff',   // White 100%
          },
          text: {
            primary: '#000000', // Black 100%
            secondary: 'rgba(0, 0, 0, 0.6)', // Black 80% (Approximation)
          },
          divider: 'rgba(0, 0, 0, 0.12)', // Standard light divider
        }
      : {
          // Dark mode palette (Based on SnowUI Bright Dark)
          primary: {
            main: '#ffffff', // Brighter Blue for dark mode
          },
          secondary: {
            main: '#BF5AF2', // Brighter Purple for dark mode
          },
          background: {
            default: '#000000', // Black 100%
            paper: '#1C1C1E',   // Darker paper (Similar to Black 80%)
          },
          text: {
            primary: '#ffffff', // White 100%
            secondary: 'rgba(255, 255, 255, 0.7)', // White 80% (Approximation)
          },
          divider: 'rgba(255, 255, 255, 0.12)', // Standard dark divider
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
          borderRadius: '16px', // More rounded corners like the image
          border: 'none', // Remove border
          boxShadow: 'none', // Remove shadow
          backgroundColor: theme.palette.mode === 'light'
            ? '#F7F9FB' // Specific light color requested
            : '#1e1e24', // Dark equivalent for dark mode
          minHeight: 280, // Set minimum height as requested
          height: '100%', // Full height
          width: '100%', // Full width to ensure consistent sizing
          '&:hover': {
            boxShadow: theme.palette.mode === 'light'
              ? '0 4px 12px rgba(0,0,0,0.05)'
              : '0 4px 12px rgba(0,0,0,0.2)'
          },
        }),
      },
    },
    // Add MuiCardContent styles for proper padding and layout
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px',
          '&:last-child': {
            paddingBottom: '20px', // Override MUI's default paddingBottom: 24px for last child
          },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      },
    },
    // Ensure Avatars are circular
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: '50%',
        },
      },
    },
    // Add MuiChip styles for user tags
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '8px',
          backgroundColor: theme.palette.mode === 'light'
            ? '#E5ECF6' // Light mode chip color (Primary-Purple as requested)
            : '#2D2D36', // Dark mode chip color
          color: theme.palette.text.secondary,
          height: '28px',
          fontSize: '0.8rem',
          fontWeight: 500,
          padding: '4px 8px',
          '& .MuiChip-label': {
            padding: '0 8px',
          },
          // Add specific styles for variants and colors
          '&.MuiChip-colorPrimary': { // Styles for selected chips (filled, primary)
            backgroundColor: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.main, // Use primary main color
            color: theme.palette.mode === 'light' ? theme.palette.primary.contrastText : theme.palette.primary.contrastText, // Use contrast text
            '&:hover': {
              backgroundColor: theme.palette.mode === 'light'
                ? alpha(theme.palette.primary.main, 0.8) // Slightly transparent black on hover (light)
                : alpha(theme.palette.primary.main, 0.8), // Slightly transparent white on hover (dark)
            },
          },
          '&.MuiChip-outlined': { // Styles for unselected chips (outlined, default)
             backgroundColor: 'transparent',
             borderColor: theme.palette.divider, // Use divider color for border
             color: theme.palette.text.secondary,
             '&:hover': {
                backgroundColor: alpha(theme.palette.text.primary, 0.05), // Subtle background on hover
                borderColor: theme.palette.mode === 'light' ? theme.palette.primary.main : theme.palette.primary.main, // Use primary color for border on hover
             },
          },
          '&.MuiChip-clickable:hover': {
             // General hover brightness adjustment (already handled by variant specific styles above)
             // filter: `brightness(${theme.palette.mode === 'light' ? 0.95 : 1.1})`,
          }
        }),
        sizeSmall: {
          height: '24px',
          fontSize: '0.75rem',
          borderRadius: '6px', // Slightly smaller radius for small chips
        },
        // Ensure delete icon inherits color for better visibility on primary chips
        deleteIconColorPrimary: ({ theme }) => ({ // Destructure theme from the argument
           color: theme.palette.mode === 'light' ? alpha(theme.palette.primary.contrastText, 0.7) : alpha(theme.palette.primary.contrastText, 0.7),
           '&:hover': {
              color: theme.palette.mode === 'light' ? theme.palette.primary.contrastText : theme.palette.primary.contrastText,
           }
        })
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
          borderRadius: '8px', // Ensure 8px border radius
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px', // Default padding
        },
        // Primary contained button (black in light mode, white in dark mode)
        containedPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.mode === 'light' 
            ? '#1C1C1C' // Primary-Brand color for light mode
            : '#ffffff', // White for dark mode
          color: theme.palette.mode === 'light' 
            ? '#ffffff' // White text for light mode
            : '#000000', // Black text for dark mode
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light'
              ? '#3C3C3C' // Lighter/brighter black for hover in light mode
              : '#f0f0f0', // Slightly darker white for hover in dark mode
          },
          '&:disabled': {
            backgroundColor: theme.palette.mode === 'light'
              ? 'rgba(28, 28, 28, 0.5)' // Faded black for disabled in light mode
              : 'rgba(255, 255, 255, 0.5)', // Faded white for disabled in dark mode
            color: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.5)' // Faded white text for disabled in light mode
              : 'rgba(0, 0, 0, 0.5)', // Faded black text for disabled in dark mode
          },
        }),
        // Outlined button
        outlinedPrimary: ({ theme }) => ({
          borderColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }),
        // Text button - subtle background with specific styling
        text: ({ theme }) => ({
          backgroundColor: theme.palette.mode === 'light'
            ? 'rgba(28, 28, 28, 0.05)' // black-5 as requested for light mode
            : 'rgba(255, 255, 255, 0.05)', // white-5 equivalent for dark mode
          color: theme.palette.mode === 'light'
            ? 'rgba(28, 28, 28, 0.8)' // Dark text for light mode
            : 'rgba(255, 255, 255, 0.8)', // Light text for dark mode
          padding: '8px 16px',
          '&:hover': {
            backgroundColor: theme.palette.mode === 'light'
              ? 'rgba(28, 28, 28, 0.1)' // Lighter hover state (less grey, more transparent)
              : 'rgba(255, 255, 255, 0.15)', // Lighter hover state for dark mode
          },
          '&:disabled': {
            backgroundColor: theme.palette.mode === 'light'
              ? 'rgba(28, 28, 28, 0.05)' // black-5 as requested for disabled in light mode
              : 'rgba(255, 255, 255, 0.05)', // white-5 equivalent for dark mode
            color: theme.palette.mode === 'light'
              ? 'rgba(28, 28, 28, 0.4)' // More faded dark text for disabled in light mode
              : 'rgba(255, 255, 255, 0.4)', // More faded light text for disabled in dark mode
          },
        }),
        // Size variants
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
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
    // Add MuiLink override
    MuiLink: {
      styleOverrides: {
        root: ({
          // Remove underline on hover by default
          textDecoration: 'none',
          // Apply hover styles
          '&:hover': {
             textDecoration: 'none', 
             color: '#95A4FC', // Apply custom hover color to the Link itself
             transition: 'color 0.2s ease-in-out',
             // ALSO apply color to direct Typography children on hover
             '& > .MuiTypography-root': { 
                color: '#95A4FC', 
                transition: 'color 0.2s ease-in-out', // Ensure transition applies here too
             }
          },
          // Restore underline if component has underline prop set to always or hover
          '&[class*="MuiLink-underlineHover"]:hover': {
            // If underline="hover", we still want our custom color, not MUI default blue
            // textDecoration: 'underline', // Restore underline if specifically requested by prop
            // textDecorationColor: '#95A4FC', // Optional: match underline color to text
          },
          '&[class*="MuiLink-underlineAlways"]': {
            textDecoration: 'underline',
            textDecorationColor: 'inherit',
             '&:hover': { 
                 color: '#95A4FC',
                 textDecorationColor: '#95A4FC',
                 '& > .MuiTypography-root': { // Ensure hover color applies here too
                    color: '#95A4FC',
                 }
             }
          }
        })
      }
    }
  },
});

// Create and export the light and dark themes
export const lightTheme = createTheme(getThemeOptions('light'));
export const darkTheme = createTheme(getThemeOptions('dark'));

// Export a function to get a theme by mode
export const getTheme = (mode: PaletteMode) => 
  mode === 'light' ? lightTheme : darkTheme;
