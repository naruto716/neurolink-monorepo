import { Outlet } from "react-router-dom";
import { ThemeProvider, CssBaseline, Container, Box } from '@mui/material';
import { theme } from './theme';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastContainer } from 'react-toastify';
import { useAppDispatch, setTokens } from "@neurolink/shared";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";

function App() {
  const auth = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setTokens({
      accessToken: auth?.user?.access_token,
      idToken: auth?.user?.id_token,
      refreshToken: auth?.user?.refresh_token,
    }));

    if (auth.isAuthenticated && window.location.search.includes('code=')) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [auth?.user, auth.isAuthenticated, dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          <Outlet />
        </Container>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App; 