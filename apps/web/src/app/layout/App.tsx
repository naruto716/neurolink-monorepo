import { Outlet } from "react-router-dom";
import { ThemeProvider, CssBaseline, Container, Box } from '@mui/material';
import { theme } from './theme';
import Navbar from './Navbar';
import Footer from './Footer';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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