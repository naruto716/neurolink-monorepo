import {
  Avatar,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
  Wheelchair
} from '@phosphor-icons/react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  
  const navItems = [
    { key: 'home', label: 'Home', path: '/', icon: <House weight="regular" size={20} /> },
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
      {/* User Profile Header - with exact specified styles */}
      <Box sx={{ 
        display: 'flex',
        padding: '8px',
        alignItems: 'center',
        alignContent: 'center',
        gap: '8px',
        alignSelf: 'stretch',
        flexWrap: 'wrap',
        mb: 2
      }}>
        <Avatar 
          src="/assets/default-avatar.png"
          alt="User Profile" 
          sx={{ 
            width: 32, 
            height: 32,
            bgcolor: theme.palette.primary.main
          }}
        />
        <NavText color={theme.palette.mode === 'dark' ? 'white' : '#1C1C1C'}>
          Ubayd Neuyen
        </NavText>
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
                  bgcolor: 'rgba(28, 28, 28, 0.05)',
                  color: theme.palette.mode === 'dark' ? 'white' : '#1C1C1C',
                },
                '&:hover': {
                  bgcolor: 'rgba(28, 28, 28, 0.05)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: theme.palette.mode === 'dark' ? 'white' : '#1C1C1C',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label}
                primaryTypographyProps={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  sx: { fontFeatureSettings: "'ss01' on, 'cv01' on" },
                  color: theme.palette.mode === 'dark' ? 'white' : '#1C1C1C'
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