import React from 'react';
import { 
  Box, 
  Drawer, 
  IconButton, 
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme
} from '@mui/material';
import { ChevronLeft, ChevronRight, Home, Info, Person, Settings } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

interface LeftSidebarProps {
  open: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 240;

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { key: 'home', label: t('nav.home'), path: '/', icon: <Home /> },
    { key: 'about', label: t('nav.about'), path: '/about', icon: <Info /> },
    { key: 'profile', label: t('nav.profile'), path: '/profile', icon: <Person /> },
    { key: 'accessibility', label: t('nav.accessibility'), path: '/accessibility', icon: <Settings /> },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shorter,
          }),
        },
      }}
    >
      <Box
        sx={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {t('app.name')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          {theme.direction === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <ListItemButton
              key={item.key}
              selected={isActive}
              onClick={() => handleNavigate(item.path)}
              sx={{
                mx: 1.5,
                mb: 0.5,
                borderRadius: '8px',
                minHeight: '44px',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive ? 'inherit' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
};

export default LeftSidebar; 