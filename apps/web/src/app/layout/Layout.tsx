import React, { useState } from 'react';
import { Container, Box } from '@mui/material';
import Navbar from './navbar/Navbar';
import { LeftSidebar } from './navbar/LeftSidebar';
import { RightSidebar } from './navbar/RightSidebar';
import { useLocation } from 'react-router-dom';
import { getSidebarContent, getSidebarTitle } from './navbar/SidebarContent';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <LeftSidebar open={leftSidebarOpen} onClose={() => setLeftSidebarOpen(false)} />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1,
        width: { sm: `calc(100% - ${rightSidebarOpen ? 280 : 0}px)` },
        transition: 'width 225ms cubic-bezier(0.0, 0, 0.2, 1) 0ms',
      }}>
        <Navbar
          toggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
          toggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
        />
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