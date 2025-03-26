import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { signOutRedirect } from '../../features/auth/auth';
import { ThemeSwitcher } from './ThemeSwitcher';
import { AccessibilityToggle } from '../components/AccessibilityToggle';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('app.name')}
        </Typography>
        <Button color="inherit" component={Link} to="/">
          {t('nav.home')}
        </Button>
        <Button color="inherit" component={Link} to="/about">
          {t('nav.about')}
        </Button>
        <Button color="inherit" component={Link} to="/accessibility">
          {t('nav.accessibility')}
        </Button>
        
        {auth.isAuthenticated ? (
          <>
            <Button color="inherit" component={Link} to="/profile">
              {t('nav.profile')}
            </Button>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
} 