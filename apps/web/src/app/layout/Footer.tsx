import { Box, Container } from '@mui/material'; // Removed Typography
import { AccessibleTypography } from '../components/AccessibleTypography'; // Added AccessibleTypography

export default function Footer() {
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 3, 
        px: 2, 
        mt: 'auto', 
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        {/* Replaced Typography */}
        <AccessibleTypography variant="body2" color="text.secondary" align="center">
          {'© '}
          {new Date().getFullYear()}
          {' Neurolink. All rights reserved.'}
        </AccessibleTypography>
      </Container>
    </Box>
  );
}
