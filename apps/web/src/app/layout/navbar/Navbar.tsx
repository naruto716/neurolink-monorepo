import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useAuth } from 'react-oidc-context';
import { signOutRedirect } from '../../../features/auth/auth';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { AccessibilityToggle } from '../../components/AccessibilityToggle';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Menu as MenuIcon, HelpOutline } from '@mui/icons-material';

interface NavbarProps {
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
}

export default function Navbar({ 
  toggleLeftSidebar, 
  toggleRightSidebar 
}: NavbarProps) {
  const auth = useAuth();
  const { t } = useTranslation();
  
  const handleLogin = () => {
    auth.signinRedirect();
  };
  
  const handleLogout = () => {
    auth.removeUser();
    signOutRedirect();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle left sidebar"
          edge="start"
          onClick={toggleLeftSidebar}
          sx={{ 
            mr: 2,
            // Keep background highlight logic if needed, or remove if only icon should indicate state
            // bgcolor: leftSidebarOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent' 
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('app.name')}
        </Typography>
        
        {/* Removed Navigation Buttons: Home, About, Accessibility */}
        
        {auth.isAuthenticated ? (
          <>
            {/* Removed Profile Button */}
            <Button color="inherit" onClick={handleLogout}>
              {t('nav.signOut')}
            </Button>
          </>
        ) : (
          <Button color="inherit" onClick={handleLogin}>
            {t('nav.signIn')}
          </Button>
        )}
        
        <Box ml={1} display="flex" alignItems="center">
          <LanguageSwitcher />
          <AccessibilityToggle />
          <ThemeSwitcher />
          <IconButton
            color="inherit"
            aria-label="toggle right sidebar"
            edge="end"
            onClick={toggleRightSidebar}
            sx={{ 
              ml: 1,
              // Keep background highlight logic if needed, or remove if only icon should indicate state
              // bgcolor: rightSidebarOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
            }}
          >
            <HelpOutline />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
} 