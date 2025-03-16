import { Box, Container, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, bgcolor: 'primary.main', color: 'white', mt: 'auto' }}>
      <Container maxWidth="sm">
        <Typography variant="body2" align="center">
          © {new Date().getFullYear()} Neurolink
        </Typography>
      </Container>
    </Box>
  );
} 