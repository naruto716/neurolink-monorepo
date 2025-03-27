import { Typography } from '@mui/material';

// Helper functions for getting sidebar content based on routes
export const getSidebarContent = (path: string) => {
  if (path === '/accessibility') {
    return (
      <>
        <Typography variant="body1" paragraph>
          This page provides accessibility options to enhance your experience.
        </Typography>
        <Typography variant="body1" paragraph>
          You can adjust text size, enable screen reader support, and modify contrast settings.
        </Typography>
      </>
    );
  }
  
  if (path === '/profile') {
    return (
      <>
        <Typography variant="body1" paragraph>
          The profile page displays your account information and settings.
        </Typography>
        <Typography variant="body1" paragraph>
          You can update your personal information, change your password, and manage notification preferences.
        </Typography>
      </>
    );
  }
  
  return (
    <Typography variant="body1">
      Select a feature or section to view more information.
    </Typography>
  );
};

export const getSidebarTitle = (path: string) => {
  if (path === '/accessibility') return 'Accessibility Help';
  if (path === '/settings') return 'Settings Help';
  if (path === '/profile') return 'Profile Help';
  return 'Help';
}; 