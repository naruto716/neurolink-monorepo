import React, { useState, useEffect } from 'react';
import { Container, Box, useMediaQuery, useTheme } from '@mui/material';
import Navbar, { NAVBAR_HEIGHT } from './navbar/Navbar';
import { LeftSidebar } from './navbar/LeftSidebar';
import { RightSidebar } from './navbar/RightSidebar';
import { Outlet, useLocation } from 'react-router-dom';
// Removed incorrect import: import { getSidebarContent, getSidebarTitle } from './navbar/SidebarContent';
import { AccessibleTypography } from '../components/AccessibleTypography'; // Keep this import

// --- Placeholder Functions ---
// TODO: Replace these with actual logic to determine sidebar content/title based on path
const getSidebarTitle = (pathname: string): string => {
  // Example logic: return different titles based on path
  if (pathname.startsWith('/profile')) return 'Profile Actions';
  if (pathname.startsWith('/settings')) return 'Settings Options';
  return 'Quick Tools'; // Default title
};

const getSidebarContent = (pathname: string): React.ReactNode => {
  // Example logic: return different components or elements based on path
  return (
    <AccessibleTypography variant="body2" color="text.secondary">
      Sidebar content for {pathname}. (Placeholder)
    </AccessibleTypography>
  );
};
// --- End Placeholder Functions ---


export default function Layout() {
  const location = useLocation();
  const theme = useTheme();
  // Check if the screen size is 'md' or larger (desktop/tablet) - Adjusted breakpoint
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); 
  
  // Initialize sidebar state based on screen size
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(isDesktop); 
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Effect to handle sidebar state changes on resize
  // Close sidebar on mobile if it was open, open on desktop if it was closed
  useEffect(() => {
    // Only force open/close based on breakpoint if user hasn't manually toggled it?
    // For now, let's keep the simpler logic: always match breakpoint default
    setLeftSidebarOpen(isDesktop); 
  }, [isDesktop]);

  return (
    <Box sx={{ display: 'flex' }}>
      <LeftSidebar open={leftSidebarOpen} onClose={() => setLeftSidebarOpen(false)} />
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1,
        // Adjust width calculation based on sidebar states and breakpoints
        width: { 
          xs: '100%',
          // Use 'md' breakpoint consistent with isDesktop check
          md: `calc(100% - ${leftSidebarOpen ? 212 : 0}px - ${rightSidebarOpen ? 280 : 0}px)` 
        },
        ml: { xs: 0, md: leftSidebarOpen ? 0 : 0 }, // Use 'md' breakpoint
        transition: theme => theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        })
      }}>
        {/* Fixed Navbar */}
        <Navbar
          toggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
          toggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
          leftSidebarOpen={leftSidebarOpen}
          rightSidebarOpen={rightSidebarOpen}
        />
        
        {/* Navbar placeholder to prevent content from going underneath */}
        <Box sx={{ height: `${NAVBAR_HEIGHT}px` }} />
        
        {/* Main content */}
        <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
          <Outlet />
        </Container>
      </Box>
      
      <RightSidebar 
        open={rightSidebarOpen} 
        onClose={() => setRightSidebarOpen(false)} 
        // Use the locally defined placeholder functions
        title={getSidebarTitle(location.pathname)} 
      >
        {/* Use the locally defined placeholder functions */}
        {getSidebarContent(location.pathname)} 
      </RightSidebar>
    </Box>
  );
}
