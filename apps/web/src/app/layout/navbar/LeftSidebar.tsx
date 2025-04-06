import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  styled,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  BookOpen,
  House,
  Info,
  User,
  Wheelchair,
  Users // Added Users icon
} from '@phosphor-icons/react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { useAppSelector } from '../../store/initStore'; // Correct path based on search
import { selectCurrentUser } from '@neurolink/shared'; // Import selector

interface LeftSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 212;

// Typography component with exact specs
const NavText = styled(Typography)({
  fontFamily: 'Inter, sans-serif',
  fontSize: '14px',
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: '20px',
  letterSpacing: '0px',
  fontFeatureSettings: "'ss01' on, 'cv01' on"
});

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const currentUser = useAppSelector(selectCurrentUser); // Get current user
  
  const navItems = [
    { key: 'social', label: 'Social', path: '/', icon: <House weight="regular" size={20} /> },
    { key: 'people', label: 'People', path: '/people', icon: <Users weight="regular" size={20} /> }, // Added People link
    { key: 'about', label: 'About', path: '/about', icon: <Info weight="regular" size={20} /> },
    // { key: 'courses', label: 'Online Courses', path: '/courses', icon: <BookOpen weight="regular" size={20} /> },
    { key: 'commitment', label: 'Commitment', path: '/courses', icon: <BookOpen weight="regular" size={20} /> },
    { key: 'profile', label: 'Profile', path: '/profile', icon: <User weight="regular" size={20} /> },
    { key: 'accessibility', label: 'Accessibility', path: '/accessibility', icon: <Wheelchair weight="regular" size={20} /> },
    // { key: 'account', label: 'Account', path: '/account', icon: <Gear weight="regular" size={20} /> },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        overflowX: 'hidden',
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: isMobile ? 'none' : '1px solid',
          borderColor: 'divider',
          bgcolor: theme.palette.background.paper,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          gap: '8px',
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {/* User Profile Header (Clickable Box) */}
      <Box
          component="button" // Make it a button element for semantics
          // Navigate to the user's specific profile page
          onClick={() => {
              if (currentUser) { // Ensure currentUser exists before navigating
                 handleNavigate(`/people/${currentUser.username}`);
              }
          }} 
          disabled={!currentUser} // Disable button if currentUser is null
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%', // Ensure it takes full width for click area
            padding: '8px', // Same padding as nav items
            borderRadius: '12px', // Same border radius
            mb: 2, // Keep existing margin bottom
            gap: '8px', // Restore gap for spacing between avatar and text
            border: 'none', // Remove button default border
            background: 'none', // Remove button default background
            cursor: currentUser ? 'pointer' : 'default', // Change cursor based on currentUser
            textAlign: 'left', // Align text to the left
            '&:hover': {
               bgcolor: currentUser // Only apply hover if clickable
                 ? (theme.palette.mode === 'dark' 
                   ? alpha(theme.palette.common.white, 0.05)
                   : alpha(theme.palette.common.black, 0.04))
                 : 'transparent', 
            },
          }}
        >
           {/* Avatar/Skeleton */}
            {currentUser ? (
            <Avatar 
                src={currentUser.profilePicture || undefined}
                alt={currentUser.displayName} 
                sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: theme.palette.primary.main // Fallback color
                }}
            />
            ) : (
            <Skeleton variant="circular" width={32} height={32} />
            )}
            {/* Name/Skeleton */}
            {currentUser ? (
            <NavText noWrap color={theme.palette.text.primary} sx={{ ml: 1 }}> { /* Use ml for spacing instead of gap */}
                {currentUser.displayName}
            </NavText>
            ) : (
            <Skeleton variant="text" width={100} height={20} sx={{ ml: 1 }}/>
            )}
      </Box>

      {/* Navigation Tabs */}
      <List sx={{ width: '100%', p: 0 }}>
        {navItems.map((item) => {
          const isActive = isActivePath(item.path);
          
          return (
            <ListItemButton
              key={item.key}
              selected={isActive}
              onClick={() => handleNavigate(item.path)}
              sx={{
                padding: '8px',
                borderRadius: '12px',
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.08) // Dark mode selected bg
                    : alpha(theme.palette.common.black, 0.05), // Light mode selected bg (keep as is or adjust)
                  color: theme.palette.text.primary, // Use primary text color for selected
                  fontWeight: 500, // Slightly bolder when selected
                  '&:hover': {
                     // Slightly darker/lighter version of selected bg on hover
                     bgcolor: theme.palette.mode === 'dark' 
                       ? alpha(theme.palette.common.white, 0.12)
                       : alpha(theme.palette.common.black, 0.08), 
                  }
                },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.05) // Dark mode hover bg
                    : alpha(theme.palette.common.black, 0.04), // Light mode hover bg (slightly lighter than selected)
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive ? theme.palette.text.primary : theme.palette.text.secondary, // Adjust icon color based on active state
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400, // Bolder if active
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  sx: { fontFeatureSettings: "'ss01' on, 'cv01' on" },
                  color: isActive ? theme.palette.text.primary : theme.palette.text.secondary // Adjust text color based on active state
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Neurolink Title at Bottom */}
      <Box sx={{ 
        mt: 'auto', 
        display: 'flex', 
        flexDirection: 'column',  // Stack elements vertically
        alignItems: 'center',     // Center items horizontally
        p: 2
      }}>
        <img 
          src="https://d2ymeg1i7s1elw.cloudfront.net/Logo.png"
          alt="Neurolink Logo"
          style={{ width: '50px', height: '50px', marginBottom: '8px' }} // Adjust size and spacing
        />
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            color: theme.palette.mode === 'dark' ? 'white' : '#1C1C1C',
            opacity: 0.7,
            fontSize: '16px'
          }}
        >
          Neurolink
        </Typography>
      </Box>

    </Drawer>
  );
};

export default LeftSidebar;
