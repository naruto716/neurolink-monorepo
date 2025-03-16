import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { signOutRedirect } from '../../features/auth/auth';

export default function Navbar() {
  const auth = useAuth();
  
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
          Neurolink
        </Typography>
        <Button color="inherit" component={Link} to="/">
          Home
        </Button>
        <Button color="inherit" component={Link} to="/about">
          About
        </Button>
        
        {auth.isAuthenticated ? (
          <>
            <Button color="inherit" component={Link} to="/profile">
              Profile
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Sign Out
            </Button>
          </>
        ) : (
          <Button color="inherit" onClick={handleLogin}>
            Sign In
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
} 