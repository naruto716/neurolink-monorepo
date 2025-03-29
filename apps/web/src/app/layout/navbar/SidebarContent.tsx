import React from 'react';
import { Box, Divider } from '@mui/material';
import { AccessibleTypography } from '../../components/AccessibleTypography'; // Added AccessibleTypography

interface SidebarContentProps {
  title: string;
  children: React.ReactNode;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ title, children }) => {
  return (
    <Box sx={{ p: 3 }}>
      {/* Replaced Typography */}
      <AccessibleTypography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {title}
      </AccessibleTypography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Box>
  );
};
