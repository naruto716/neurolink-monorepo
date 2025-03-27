import { AppBar, Toolbar, Box, IconButton, InputBase, Tooltip } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '../../../features/theme/hooks';
import { 
  Sidebar, 
  MagnifyingGlass, 
  Sun, 
  Moon, 
  Bell, 
  SquaresFour,
  House
} from '@phosphor-icons/react';
import Breadcrumb from '../../components/Breadcrumb';
import { useLocation } from 'react-router-dom';
import { AccessibilityToggle } from '../../components/AccessibilityToggle';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

interface NavbarProps {
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

// Navbar height for consistency
export const NAVBAR_HEIGHT = 68;

export default function Navbar({ 
  toggleLeftSidebar, 
  toggleRightSidebar,
  leftSidebarOpen,
  rightSidebarOpen 
}: NavbarProps) {
  const muiTheme = useMuiTheme();
  const { toggleTheme } = useAppTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const location = useLocation();
  
  // Force "Home" breadcrumb for the root path
  const customBreadcrumbItems = location.pathname === '/' 
    ? [{ label: 'Home', path: '/' }]
    : undefined;
  
  // Calculate side margins based on sidebar states
  const leftSidebarWidth = leftSidebarOpen ? 212 : 0;
  const rightSidebarWidth = rightSidebarOpen ? 280 : 0;
  
  return (
    <AppBar 
      position="fixed" 
      color="default"
      sx={{
        boxShadow: 'none',
        borderBottom: `1px solid ${muiTheme.palette.divider}`,
        backgroundColor: muiTheme.palette.mode === 'light' 
          ? 'rgba(255, 255, 255, 0.8)' 
          : 'rgba(18, 18, 18, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        left: { xs: 0, md: leftSidebarWidth },
        right: { xs: 0, md: rightSidebarWidth },
        width: { 
          xs: '100%', 
          md: `calc(100% - ${leftSidebarWidth}px - ${rightSidebarWidth}px)` 
        },
        transition: (theme) => theme.transitions.create(['width', 'left', 'right'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          width: '100%',
          padding: '14px 28px',
          height: `${NAVBAR_HEIGHT}px`,
          minHeight: `${NAVBAR_HEIGHT}px`,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Left side with menu and navigation icons */}
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={toggleLeftSidebar}
            sx={{ padding: 1 }}
          >
            <Sidebar size={24} />
          </IconButton>
          
          <IconButton 
            color="inherit"
            aria-label="home"
            sx={{ padding: 1 }}
          >
            <House size={24} />
          </IconButton>
          
          {/* Dynamic Breadcrumb */}
          <Breadcrumb customItems={customBreadcrumbItems} />
        </Box>
        
        {/* Right side with search and icons */}
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Search input */}
          <Box 
            sx={{ 
              display: 'flex',
              width: '160px',
              padding: '4px 8px',
              alignItems: 'center',
              gap: '8px',
              borderRadius: '4px',
              backgroundColor: muiTheme.palette.mode === 'light' 
                ? 'rgba(0, 0, 0, 0.05)' 
                : 'rgba(255, 255, 255, 0.05)',
            }}
          >
            <MagnifyingGlass size={16} color={muiTheme.palette.text.secondary} />
            <InputBase
              placeholder="Search..."
              inputProps={{ 'aria-label': 'search' }}
              sx={{ 
                fontSize: '14px',
                color: muiTheme.palette.text.primary,
                width: '100%',
                '& input': {
                  padding: '2px 0',
                }
              }}
            />
          </Box>
          
          {/* Action icons */}
          <Tooltip title={isDarkMode ? "Light mode" : "Dark mode"}>
            <IconButton 
              color="inherit" 
              size="small"
              onClick={toggleTheme}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </IconButton>
          </Tooltip>
          
          {/* Language switcher */}
          <LanguageSwitcher />
          
          {/* Accessibility options */}
          <AccessibilityToggle />
          
          <Tooltip title="Notifications">
            <IconButton color="inherit" size="small">
              <Bell size={20} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Apps">
            <IconButton 
              color="inherit" 
              size="small"
              onClick={toggleRightSidebar}
            >
              <SquaresFour size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 