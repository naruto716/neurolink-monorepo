import React, { useState, useEffect } from 'react'; // Added useEffect
import { Container, Box, useMediaQuery, useTheme } from '@mui/material'; // Added useMediaQuery, useTheme
import Navbar, { NAVBAR_HEIGHT } from './navbar/Navbar';
import { LeftSidebar } from './navbar/LeftSidebar';
import { RightSidebar } from './navbar/RightSidebar';
import { useLocation } from 'react-router-dom';
import { getSidebarContent, getSidebarTitle } from './navbar/SidebarContent';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const theme = useTheme();
  // Check if the screen size is 'sm' or larger (desktop/tablet)
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); 
  
  // Initialize sidebar state based on screen size
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(isDesktop); 
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Effect to handle sidebar state changes on resize
  // Close sidebar on mobile if it was open, open on desktop if it was closed
  useEffect(() => {
    setLeftSidebarOpen(isDesktop);
  }, [isDesktop]);

  return (
    <Box sx={{ display: 'flex' }}>
      <LeftSidebar open={leftSidebarOpen} onClose={() => setLeftSidebarOpen(false)} />
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1,
        width: { 
          xs: '100%',
          sm: `calc(100% - ${leftSidebarOpen ? 212 : 0}px - ${rightSidebarOpen ? 280 : 0}px)` 
        },
        ml: { xs: 0, sm: leftSidebarOpen ? 0 : 0 },
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
          {children}
        </Container>
      </Box>
      
      <RightSidebar 
        open={rightSidebarOpen} 
        onClose={() => setRightSidebarOpen(false)} 
        title={getSidebarTitle(location.pathname)}
      >
        {getSidebarContent(location.pathname)}
      </RightSidebar>
    </Box>
  );
}
